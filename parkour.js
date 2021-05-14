

/**
 * 
 * @param {string} container 容器,即游戏运行在该容器的内部
 * @param {*} options 
 * {
 *    size: {                 //各尺寸配置
 *      container: {          //容器尺寸
 *        width: 400,       
 *        height: 300
 *      },
 *      protagonist: {        //主角尺寸
 *        width: 64,
 *        height: 64
 *      },
 *      awards: [             //奖品尺寸(多种)
 *        {
 *          width: 64,
 *          height: 64
 *        }
 *      ],
 *      background: {         //背景尺寸
 *        width: 400
 *      },
 *      tile: {               //地块尺寸(所有地块的宽度需要一致)
 *        width: 64           
 *      },
 *      tiles: [              //地块尺寸(不同高度的地块的设置)
 *        {     
 *          height: 64
 *        }
 *      ],
 *    },
 *    assets: {               //各资源的配置
 *      protagonist: {        //主角资源配置
 *        staying: '....jpg'  //主角站立时的图片
 *        running: [          //奔跑动作的帧图片
 *           '....jpg'
 *        ],
 *        jumping: '....jpg'  //跳跃动作的图片
 *      },
 *      background: [         //背景图,(背景滚动时可以多张首尾衔接)
 *        '....jpg'
 *      ],
 *      tiles: [              //地块图片资源
 *        {
 *          left: [           //左侧地块图片资源(多个时每次随机一个)
 *            '....jpg'
 *          ],
 *          middle: [         //中间地块图片资源(多个时每次随机一个)
 *            '....jpg'
 *          ],
 *          right: [          //右侧地块图片资源(多个时每次随机一个)
 *            '....jpg'
 *          ]
 *        }
 *      ],
 *      awards: [
 *        {
 *          normal: '....jpg' //正常状态下的奖品图片
 *        }
 *      ]
 *    },
 *    config: {
 *      fps: 25,              //帧率
 *      protagonist: {        //主角配置
 *        run: {              //奔跑配置
 *          start: 100,       //开始位置
 *          speed: 2          //奔跑速度(可以接受方法,根据当前的得分和已用时长跳转速度,function(score,time))
 *        },
 *        jump: {             //跳跃配置
 *          power: 80,        //跳跃力度(px/s)
 *          gravity: 10,      //重力加速度(px/s²)
 *          time: 1500        //空中停留时间
 *        }
 *      },
 *      awards: [             //奖品配置
 *        {
 *          score: 1          //奖品获得的积分配置
 *        }
 *      ],
 *      tile: {
 *        maxEmpty: 2         //最大空隙
 *        minLand: 2          //最小陆地
 *      },
 *      win: {                //胜利条件
 *        time: Infinity,     //到达指定时间获胜
 *        score: Infinity     //获得指定积分获胜
 *      },
 *      background: {
 *        speed: 10           //背景卷动的速度
 *      }
 *    }
 * }
 */
var Parkour = function(container, options) {
  var _this = this;

  this.status = 'UNINITED';

  var assetsCount = 0;

  /**
   * 初始化容器
   * @param {String|Element} container 
   * @param {*} size 
   */
  function initContainer(container, size) {
    if (!container) throw '必须指定容器';
    if (typeof container === 'string') container = document.getElementById(container);
    container.style.overflow = 'hidden';
    container.style.width = size.width + 'px';
    container.style.height = size.height + 'px';
    if (container.style.position !== 'relative' && container.style.position !== 'absolute') container.style.position = 'relative';
    container.innerHTML = '';
    return container;
  }

  /**
   * 加载图片资源
   * @param {} image 
   */
  function initImage(image, prev) {
    if (typeof image === 'string') {
      if (image === '') return prev;
      assetsCount++;
      var result = new Image();
      result.onload = function() {
        assetsCount--;
        if (assetsCount === 0) {
          _this.inited();
        }
      }
      result.onerror = function() {
        assetsCount--;
        if (assetsCount === 0) {
          _this.inited();
        }
      }
      result.src = image;
      return result;
    } else {
      return image;
    }
  }

  function initImages(images) {
    var prev;
    if (!(images instanceof Array)) images = [images];
    for (var i = 0; i < images.length; i++) {
      images[i] = initImage(images[i], prev);
      prev = images[i];
    }
    return images;
  }

  function initSize(size) {
    if (!size) throw '必须配置尺寸';
    if (!size.container) throw '必须配置容器尺寸';
    if (!size.protagonist) throw '必须配置主角尺寸';
    if (!size.background) throw '必须配置背景尺寸';
    if (!size.tile) throw '必须配置地块尺寸';
    if (!size.tiles || !size.tiles.length) throw '必须配置地块尺寸';
    if (!size.awards || !size.awards.length) throw '必须配置奖品尺寸';
  }

  function initAssets(assets) {
    if (!assets.protagonist.running) throw '必须配置主角奔跑图片';
    assets.protagonist.running = initImages(assets.protagonist.running);
    if (!assets.protagonist.jumping) throw '必须配置主角跳跃图片';
    assets.protagonist.jumping = initImage(assets.protagonist.jumping);
    if (!assets.protagonist.deading) throw '必须配置主角下坠死亡图片';
    assets.protagonist.deading = initImage(assets.protagonist.deading);
    if (!assets.protagonist.dead) throw '必须配置主角直接死亡图片';
    assets.protagonist.dead = initImage(assets.protagonist.dead);
    if (!assets.protagonist.staying) throw '必须配置主角站立图片';
    assets.protagonist.staying = initImage(assets.protagonist.staying);
    if (!assets.backgrounds) throw '必须配置背景图';
    assets.backgrounds = initImages(assets.backgrounds);
    if (!assets.tiles || !assets.tiles.length) throw '必须配置地块';
    for (var i = 0; i < assets.tiles.length; i++) {
      var tile = assets.tiles[i];
      if (!tile.left) throw '必须配置地块左侧图片';
      tile.left = initImages(tile.left);
      if (!tile.middle) throw '必须配置地块中间图片';
      tile.middle = initImages(tile.middle);
      if (!tile.right) throw '必须配置地块右侧图片';
      tile.right = initImages(tile.right);
    }
    if (!assets.awards || !assets.awards.length) throw '必须配置奖品图片'
    for (var i = 0; i < assets.awards.length; i++) {
      assets.awards[i].normal = initImages(assets.awards[i].normal);
    }
    if (!assets.flags || !assets.flags.length) throw '必须配置奖品图片'
    for (var i = 0; i < assets.flags.length; i++) {
      assets.flags[i] = initImages(assets.flags[i]);
    }
    if (!assets.enemies) assets.enemies = [];
    for (var i = 0; i < assets.enemies.length; i++) {
      assets.enemies[i].running = initImages(assets.enemies[i].running);
      assets.enemies[i].dead = initImage(assets.enemies[i].dead);
    }
  }

  function initConfig(config) {
    if (!config.fps) throw '必须配置帧率';
    config.fps = Parkour.Utils.asFunction(config.fps);
    if (!config.protagonist) throw '必须设置主角配置';
    if (!config.protagonist.run) throw '必须设置主角奔跑配置';
    if (!config.protagonist.run.speed) throw '必须配置主角奔跑速度';
    config.protagonist.run.speed = Parkour.Utils.asFunction(config.protagonist.run.speed);
    if (!config.protagonist.run.start) throw '必须配置主角起跑位置';
    if (!config.protagonist.jump) throw '必须设置主角配置配置';
    if (!config.win) throw '必须设置胜利条件';
    if (!config.background) throw '必须设置背景配置';
    config.background.speed = Parkour.Utils.asFunction(config.background.speed);
    config.tiles.empty.min = Parkour.Utils.asFunction(config.tiles.empty.min);
    config.tiles.empty.max = Parkour.Utils.asFunction(config.tiles.empty.max);
    config.tiles.land.min = Parkour.Utils.asFunction(config.tiles.land.min);
    config.tiles.land.max = Parkour.Utils.asFunction(config.tiles.land.max);
  }
  
  this.options = options || {};
  initSize(this.options.size);
  initAssets(this.options.assets);
  initConfig(this.options.config);

  this.container = initContainer(container, this.options.size.container);

  //整个容器的尺寸
  this.size = this.options.size.container;
  //记录游戏的开始时间
  this.begin = 0;
  //记录游戏的得分
  this.score = 0;
  //相机位置
  this.camera = 0;
  //浮动标记
  this.flags = [];
  //怪物
  this.enemies = [];
  //config
  this.tickConfig();

  this.checkTiles();
  this.checkEnemies();
  this.checkProtagonist();
  this.checkAwards();
  this.checkBackgrounds();
  
  // this.resize(this.options.container.clientWidth, this.options.container.clientHeight);
}

Parkour.ZIndex = {
  background: 0,
  flag: 1,
  tile: 2,
  award: 3,
  enemy: 4,
  protagonist: 5
}

Parkour.Utils = {
  /**
   * 从数组中随机出一个元素
   * @param {Array} array 
   * @returns 
   */
  random: function(array) {
    return array[Math.floor(Math.random() * array.length)];
  },
  /**
   * 获取数组最后符合条件元素的数量
   * @param {Array} array 
   * @param {Function} provider (element: any) => boolean
   */
  lastCount: function(array, provider) {
    var count = 0;
    for (var i = array.length - 1; i >= 0; i--) {
      if (provider(array[i])) {
        count++;
      } else {
        break;
      }
    }
    return count;
  },
  /**
   * 获取数组中最后一个符合条件的元素
   * @param {Array} array 
   * @param {Function} provider (element: any) => boolean
   * @returns 
   */
  last: function(array, provider) {
    for (var i = array.length - 1; i >= 0; i--) {
      if (provider(array[i])) {
        return array[i];
      }
    }
  },
  /**
   * 删除数组中所有符合条件的元素
   * @param {Array}} array 
   * @param {Function} provider (element: any) => boolean
   */
  remove: function(array, provider) {
    for (var i = 0; i < array.length; i++) {
      if (provider(array[i])) {
        array.splice(i, 1);
        i--;
      }
    }
  },
  /**
   * 从数组中筛选符合条件的元素,组成新的数组
   * @param {Array} array 
   * @param {Function} provider 
   * @returns 
   */
  filter: function(array, provider) {
    var result = [];
    for (var i = 0; i < array.length; i++) {
      if (provider(array[i])) {
        result.push(array[i])
      }
    }
    return result;
  },
  /**
   * 判断一个数组中是否包含符合条件的元素
   * @param {Array} array 
   * @param {Function} provider 
   * @returns 
   */
  contains: function(array, provider) {
    for (var i = 0; i < array.length; i++) {
      if (provider(array[i])) {
        return true;
      }
    }
    return false;
  },
  asFunction: function(value) {
    if (typeof value === 'function') {
      return value;
    } else {
      return function() {
        return value;
      }
    }
  },
  hint: function(center, size, otherCenter, otherSize) {
    return Parkour.Utils.hintVer(center, size, otherCenter, otherSize) === 0 && Parkour.Utils.hintHor(center, size, otherCenter, otherSize) === 0;
  },
  /**
   * 返回  >0 表示在上面  <0 表示在下面  =0表示重叠
   * @param {*} center 
   * @param {*} size 
   * @param {*} otherCenter 
   * @param {*} otherSize 
   * @returns 
   */
  hintVer: function(center, size, otherCenter, otherSize) {
    if (center.y - size.height / 2 + (size.bottom || 0) >= otherCenter.y + otherSize.height / 2 - (otherSize.top || 0)) {
      return 1;
    } else if (center.y + size.height / 2 - (size.top || 0) <= otherCenter.y - otherSize.height / 2 + (otherSize.bottom || 0)) {
      return -1;
    } else {
      return 0;
    }
  },
  /**
   * 返回  >0 表示在右侧  <0 表示在左侧  =0表示重叠
   * @param {*} center 
   * @param {*} size 
   * @param {*} otherCenter 
   * @param {*} otherSize 
   * @returns 
   */
  hintHor: function(center, size, otherCenter, otherSize) {
    if (center.x - size.width / 2 + (size.left || 0) >= otherCenter.x + otherSize.width / 2 - (otherSize.right || 0)) {
      return 1;
    } else if (center.x + size.width / 2 - (size.right || 0) <= otherCenter.x - otherSize.width / 2 + (otherSize.left || 0)) {
      return -1;
    } else {
      return 0;
    }
  }
}

Parkour.prototype = {
  inited: function() {
    this.status = 'INITED';
    this.draw();
    this.onInited && this.onInited();
  },
  isPlaying: function() {
    return this.status === 'PLAYING';
  },
  isInited: function() {
    return this.status === 'INITED';
  },
  /**
   * 开始游戏
   */
  start: function() {
    var _this = this;
    
    this.status = 'PLAYING';
    this.protagonist.run();
    this.begin = +Date.now();
    this.addScore(-this.score);

    function loop() {
      _this.ticker = setTimeout(function() {

        _this.tick();
        
        _this.checkTiles();
        _this.checkEnemies();
        _this.checkProtagonist();
        _this.checkAwards();
        _this.checkBackgrounds();
  
        var result = _this.check();
  
        _this.draw();
  
        if (typeof result !== 'undefined') {
          clearTimeout(_this.ticker);
          setTimeout(function() {
            if (result) {
              _this.onWin && _this.onWin();
            } else {
              _this.onLose && _this.onLose();
            }
          })
        } else {
          loop();
        }
      }, Math.floor(1000 / _this.config.fps));
    }
    loop();
  },
  tick: function() {
    this.tickConfig();
    this.camera += this.protagonist.speed;
    this.protagonist.tick();
    for (var i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i]) {
        this.tiles[i].tick();
      }
    }
    for (var i = 0; i < this.awards.length; i++) {
      this.awards[i].tick();
    }
    for (var i = 0; i < this.backgrounds.length; i++) {
      this.backgrounds[i].tick();
    }
    for (var i = 0; i < this.flags.length; i++) {
      this.flags[i].tick();
    }
    for (var i = 0; i < this.enemies.length; i++) {
      this.enemies[i].tick();
    }
  },
  draw: function() {
    this.protagonist.draw();
    for (var i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i]) {
        this.tiles[i].draw();
      }
    }
    for (var i = 0; i < this.awards.length; i++) {
      this.awards[i].draw();
    }
    for (var i = 0; i < this.backgrounds.length; i++) {
      this.backgrounds[i].draw();
    }
    for (var i = 0; i < this.flags.length; i++) {
      this.flags[i].draw();
    }
    for (var i = 0; i < this.enemies.length; i++) {
      this.enemies[i].draw();
    }
  },
  check: function() {
    this.protagonist.checkTile();
    for (var i = 0; i < this.awards.length; i++) {
      this.protagonist.checkAward(this.awards[i]);
    }
    var maxRebound = 0;
    var maxHigh = 0;
    for (var i = 0; i < this.enemies.length; i++) {
      var result = this.protagonist.checkEnemy(this.enemies[i]);
      if (result && result.rebound > maxRebound) maxRebound = result.rebound;
      if (result && result.high > maxHigh) maxHigh = result.high;
    }
    if (maxRebound) {
      this.protagonist.jump(maxRebound, maxHigh, this.protagonist.config.jump.count);
    }
    if (this.score >= this.options.config.win.score || (+Date.now() - this.begin) >= this.options.config.win.time) {
      return true;
    } else if (this.protagonist.dead()) {
      return false;
    }
  },
  jump: function(power) {  //跳跃
    this.protagonist.jump(power);
  },
  startJump: function(dpower) {  //起跳
    this.protagonist.startJump(dpower);
  },
  stopJump: function() {  //停止跳跃
    this.protagonist.stopJump();
  },
  findTile: function(location) {
    for (var i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i].location <= location && this.tiles[i].location + this.tiles[i].size.width > location) {
        return this.tiles[i];
      }
    }
  },
  tickConfig: function() {
    var time = +Date.now() - this.begin;
    this.config = {
      fps: this.options.config.fps(this.score, time),
      tiles: {
        empty: {
          min: this.options.config.tiles.empty.min(this.score, time),
          max: this.options.config.tiles.empty.max(this.score, time)
        },
        land: {
          min: this.options.config.tiles.land.min(this.score, time),
          max: this.options.config.tiles.land.max(this.score, time)
        }
      }
    }
  },
  checkProtagonist: function() {
    if (!this.protagonist) {
      var tile = this.findTile(this.options.config.protagonist.run.start);
      this.protagonist = new Parkour.Protagonist(this, tile, this.options.config.protagonist, this.options.size.protagonist, this.options.assets.protagonist);
    } else {
      this.protagonist.tile = this.findTile(this.protagonist.location);
      this.protagonist.right = this.findTile(this.protagonist.location + this.protagonist.size.width / 2);
      this.protagonist.left = this.findTile(this.protagonist.location - this.protagonist.size.width / 2);
    }
  },
  checkEnemies: function() {
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      enemy.tile = this.findTile(enemy.location);
      enemy.right = this.findTile(enemy.location + enemy.size.width / 2);
      enemy.left = this.findTile(enemy.location - enemy.size.width / 2);
      enemy.checkTile();
      for (var j = i + 1; j < this.enemies.length; j++) {
        enemy.checkEnemy(this.enemies[j]);
      }
    }
  },
  /**
   * 检查地块,右侧不足时填补新的地块,左侧超出屏幕时移除地块
   */
  checkTiles: function() {
    var _this = this;
    if (!this.tiles) this.tiles = [];
    var lastTile = this.tiles[this.tiles.length - 1];
    var tileWidth = this.options.size.tile.width;
    while(!this.tiles.length || lastTile.location < this.camera + this.options.size.container.width || Parkour.Utils.contains(this.enemies, function(enemy) { return enemy.location + enemy.size.width / 2 + 1 >= lastTile.location + tileWidth })) {
      var tile;
      var tileLocation;
      var needFlag; //当前地块必须要添加标记
      if (!lastTile) {  //没有前一个地块,表示第一个地块
        tileLocation = 0;
        needFlag = this.checkFlags(tileLocation, tileWidth, 1); //当前地块必须要添加标记
        tile = new Parkour.Tile(this, tileLocation, 0, 'middle', { width: tileWidth, height: this.options.size.tiles[0].height }, Parkour.Utils.random(this.options.assets.tiles[0].middle));
      } else {
        tileLocation = lastTile.location + tileWidth;
        needFlag = this.checkFlags(tileLocation, tileWidth, 1); //当前地块必须要添加标记
        if (tileLocation < this.options.size.container.width) {  //第一屏的地块
          tile = new Parkour.Tile(this, tileLocation, 0, 'middle', { width: tileWidth, height: this.options.size.tiles[0].height }, Parkour.Utils.random(this.options.assets.tiles[0].middle));
        } else {
          var hasFlag2 = this.checkFlags(tileLocation, tileWidth, 2); //当前地块与后一个地块中至少有一个需要添加标记
          var hasFlag3 = this.checkFlags(tileLocation, tileWidth, 3); //当前地块与后两个地块中至少有一个需要添加标记
          if (lastTile.empty) { //前一个地块时空地块(悬崖)
            var needLeft;
            if (hasFlag2) { //后面地块需要添加标记,必须是陆地,所以接下来要添加在地块;
              needLeft = true;
            } else {
              var emptyCount = Parkour.Utils.lastCount(this.tiles, function(tile) { return tile.empty });  //获取已有连续空地块的数量
              if (emptyCount < this.config.tiles.empty.min) {  //如果空地块数量小于配置的最低要求则依然是空地块
                needLeft = false;
              } else if (emptyCount >= this.config.tiles.empty.max) {  //如果空地块数量达到最高要求,则需要加入左侧地块
                needLeft = true;
              } else {  //否则随机空地块或左侧地块
                needLeft = emptyCount >= Math.random() * (this.config.tiles.empty.max - this.config.tiles.empty.min + 1) + this.config.tiles.empty.min;
              }
            }
            if (needLeft) {
              var maxHigh = this.protagonist.maxHigh();
              var canTiles = Parkour.Utils.filter(this.options.size.tiles, function(tile) {
                return tile.height < lastTile.size.height + maxHigh - _this.protagonist.size.height / 2;
              });
              var tileIndex = this.options.size.tiles.indexOf(canTiles[Math.floor(canTiles.length * Math.random())]);
              tile = new Parkour.Tile(this, tileLocation, tileIndex, 'left', { width: tileWidth, height: this.options.size.tiles[tileIndex].height }, Parkour.Utils.random(this.options.assets.tiles[tileIndex].left));
            } else {
              tile = new Parkour.Tile(this, tileLocation, 0, '', { width: tileWidth, height: lastTile.size.height });
            }
          } else {
            switch(lastTile.type) {
              case 'middle':
                var needRight;
                if (hasFlag3) { //如果当前地块或接下来两个地块中必须添加标记,则不能创建右侧地块
                  needRight = false;
                } else {
                  var landCount = Parkour.Utils.lastCount(this.tiles, function(tile) { return tile.type === 'middle' }); //获取已有连续的陆地的地块数量(类型为middle的表示陆地)
                  if (landCount < this.config.tiles.land.min) {
                    needRight = false;
                  } else if (landCount >= this.config.tiles.land.max) {
                    needRight = true;
                  } else {
                    needRight = landCount >= Math.random() * (this.config.tiles.land.max - this.config.tiles.land.min + 1) + this.config.tiles.land.min;
                  }
                }
                if (needRight) {
                  tile = new Parkour.Tile(this, tileLocation, lastTile.index, 'right', { width: tileWidth, height: this.options.size.tiles[lastTile.index].height }, Parkour.Utils.random(this.options.assets.tiles[lastTile.index].right));
                } else {
                  tile = new Parkour.Tile(this, tileLocation, lastTile.index, 'middle', { width: tileWidth, height: this.options.size.tiles[lastTile.index].height }, Parkour.Utils.random(this.options.assets.tiles[lastTile.index].middle));
                }
                break;
              case 'left':
                tile = new Parkour.Tile(this, tileLocation, lastTile.index, 'middle', { width: tileWidth, height: this.options.size.tiles[lastTile.index].height }, Parkour.Utils.random(this.options.assets.tiles[lastTile.index].middle));
                break;
              case 'right':
                tile = new Parkour.Tile(this, tileLocation, 0, '', { width: tileWidth, height: lastTile.size.height });
                break;
            }
          }

          if (tile.type === 'middle') {
            for (var i = 0; i < this.options.config.enemies.length; i++) {
              var enemyConfig = this.options.config.enemies[i];
              if (Math.random() < enemyConfig.probability) {
                this.enemies.push(new Parkour.Enemy(this, tile, Math.random() < 0.5 ? 1 : -1, enemyConfig, this.options.size.enemies[i], this.options.assets.enemies[i]));
                break;
              }
            }
          }
        }
      }
      if (needFlag) {
        for (var i = 0; i < this.options.config.flags.length; i++) {
          if (this.checkFlag(this.options.config.flags[i], tileLocation, tileWidth, 1)) { //这是一个必须要添加的地块上的标记
            tile.addFlag(this.options.config.flags[i], this.options.size.flags[i], this.options.assets.flags[i]);
          }
        }
      } else if (tile.type === 'middle') {
        for (var i = 0; i < this.options.config.flags.length; i++) {
          var flagConfig = this.options.config.flags[i];
          if (!this.options.config.flags[i].float && typeof flagConfig.probability !== 'undefined' && Math.random() < flagConfig.probability) { //随机是否添加地块上的标记
            tile.addFlag(flagConfig, this.options.size.flags[i], this.options.assets.flags[i]);
          }
        }
      }

      for (var i = 0; i < this.options.config.flags.length; i++) {
        var flagConfig = this.options.config.flags[i];
        if (flagConfig.float && typeof flagConfig.probability !== 'undefined' && Math.random() < flagConfig.probability) {
          this.flags.push(new Parkour.Flag(this, tile, flagConfig, this.options.size.flags[i], this.options.assets.flags[i]));
        }
      }

      this.tiles.push(tile);
      lastTile = tile;
    }
    Parkour.Utils.remove(this.tiles, function(tile) {
      return tile.destory();
    });
  },
  /**
   * 检查当前地块或后几个地块是否一定包含一个标记,如果包含标记,则只能创建middle类型的地块
   */
  checkFlags: function(location, tileWidth, count) {
    var _this = this;
    return Parkour.Utils.contains(this.options.config.flags, function(flag) {
      return _this.checkFlag(flag, location, tileWidth, count);
    })
  },
  checkFlag: function(flagConfig, location, tileWidth, count) {
    return !flagConfig.float && typeof flagConfig.location !== 'undefined' && flagConfig.location >= location && flagConfig.location < location + tileWidth * count;
  },
  /**
   * 检查奖品,右侧无奖品时随机产生奖品,左侧奖品超出屏幕时或奖品被获得后移除
   */
  checkAwards: function() {
    if (!this.awards) this.awards = [];
    var lastAward = this.awards[this.awards.length - 1];
    var award;
    if (!lastAward || (lastAward.location + lastAward.size.width / 2 < this.camera + this.size.width && Math.random() < 0.005)) {
      var lastTile = this.tiles[this.tiles.length - 1];
      var tileWidth = this.options.size.tile.width;
      var awardIndex = Math.floor(this.options.size.awards.length * Math.random());
      var size = this.options.size.awards[awardIndex];
      if (lastTile.empty) {
        var lastNotEmptyTile = Parkour.Utils.last(this.tiles, function(tile) { return !tile.empty; });
        award = new Parkour.Award(this, lastTile.location + size.width / 2 + Math.floor((tileWidth - size.width) * Math.random()), lastNotEmptyTile.size.height + Math.floor(this.protagonist.maxHigh() * Math.random()), this.options.config.awards[awardIndex], size, this.options.assets.awards[awardIndex]);
      } else {
        award = new Parkour.Award(this, lastTile.location + size.width / 2 + Math.floor((tileWidth - size.width) * Math.random()), lastTile.size.height + Math.floor(this.protagonist.maxHigh() * Math.random()), this.options.config.awards[awardIndex], size, this.options.assets.awards[awardIndex]);
      }
    }
    if (award) {
      this.awards.push(award);
    }
    Parkour.Utils.remove(this.awards, function(award) {
      return award.destory();
    });
  },
  /**
   * 检查背景图片,右侧无背景时随机产生背景,左侧背景超出屏幕时移除
   */
  checkBackgrounds: function() {
    var _this = this;
    if (!this.backgrounds) this.backgrounds = [];
    var lastBackground = this.backgrounds[this.backgrounds.length - 1];
    var backgroundWidth = this.options.size.background.width;
    while(!this.backgrounds.length || lastBackground.location < this.camera + this.options.size.container.width) {
      if (lastBackground) {
        this.backgrounds.push(new Parkour.Background(this, lastBackground.location + backgroundWidth, this.options.config.background, this.options.size.background, Parkour.Utils.random(this.options.assets.backgrounds)));
      } else {
        this.backgrounds.push(new Parkour.Background(this, 0, this.options.config.background, this.options.size.background, Parkour.Utils.random(this.options.assets.backgrounds)));
      }
      lastBackground = this.backgrounds[this.backgrounds.length - 1];
    }
    Parkour.Utils.remove(this.backgrounds, function(background) {
      return background.destory();
    });
  },
  /**
   * 加分
   * @param {Number} score 
   */
  addScore: function(score) {
    this.score += score;
    this.onScoreChange && this.onScoreChange(this.score, this.options.config.win.score);
  }
}

/**
 * 
 * @param {Parkour} parkour 
 * @param {Parkour.Tile} tile 当前所处的地块上
 * @param {*} config 
 * @param {*} size 
 * @param {*} assets 
 */
Parkour.Protagonist = function(parkour, tile, config, size, assets) {
  this.parkour = parkour;
  this.tile = tile;  //主角当前所处的地块
  this.right = tile; //主角右侧所处的地块
  this.left = tile;  //主角左侧所处的地块
  this.config = config;
  this.size = size;
  this.assets = assets;

  this.frame = 0; //在任一种状态下播放的帧数
  this.status = 'READY'; //状态:READY:初始状态,RUNNING:奔跑状态,JUMPING:跳跃状态,DEADING:坠落状态

  this.location = this.config.run.start;  //主角当前的位置
  this.high = tile.size.height; //主角高度=地块的高度
  this.speed = this.config.run.speed(0, 0); //主角的移动速度(撞墙后停止)

  this.jumping = 0;   //蓄力跳跃
  
  this.els = this.initElement();
}

Parkour.Protagonist.prototype = {
  initElement: function() {
    var protagonist = document.createElement('div');

    var staying = this.assets.staying.cloneNode();
    staying.style.width = this.size.width + 'px';
    staying.style.height = this.size.height + 'px';
    staying.style.display = 'none';
    protagonist.appendChild(staying);

    var running = [];
    for (var i = 0; i < this.assets.running.length; i++) {
      var r = this.assets.running[i].cloneNode();
      r.style.width = this.size.width + 'px';
      r.style.height = this.size.height + 'px';
      r.style.display = 'none';
      protagonist.appendChild(r);
      running.push(r);
    }

    var jumping = this.assets.jumping.cloneNode();
    jumping.style.width = this.size.width + 'px';
    jumping.style.height = this.size.height + 'px';
    jumping.style.display = 'none';
    protagonist.appendChild(jumping);

    var dead = this.assets.dead.cloneNode();
    dead.style.width = this.size.width + 'px';
    dead.style.height = this.size.height + 'px';
    dead.style.display = 'none';
    protagonist.appendChild(dead);

    protagonist.style.position = 'absolute';
    protagonist.style.display = 'none';
    protagonist.style.width = this.size.width + 'px';
    protagonist.style.height = this.size.height + 'px';
    protagonist.style.zIndex = Parkour.ZIndex.protagonist;
    this.parkour.container.appendChild(protagonist);
    return {
      el: protagonist,
      staying: staying,
      running: running,
      jumping: jumping,
      dead: dead
    };
  },
  /**
   * 最高跳跃高度
   * 根据能量守恒定律,动能做功=重力势能做功
   *    1
   * ∵ — m v² = m g h
   *    2
   * =>
   *         v²
   * ∴ h = ———
   *        2 g
   */
  maxHigh: function() {
    return this.config.jump.power * this.config.jump.power / 2 / this.config.jump.gravity;
  },
  tick: function() {
    this.speed = this.config.run.speed(this.parkour.score, +Date.now() - this.parkour.begin);
    if (this.jumping > 0) this.jumpPower = Math.min(Math.sqrt(this.jumpPower * this.jumpPower * 2 + this.jumping * this.jumping * 2), this.config.jump.power);
    switch (this.status) {
      case 'READY':
        this.frame = 0;
        break;
      case 'RUNNING':
        this.location += this.speed;
        this.frame = (this.frame + 1) % this.assets.running.length;
        break;
      case 'JUMPING':
        this.location += this.speed;
        this.frame++;
        //位移 = 初速度 * 时间 + 1/2 * 加速度 * 时间^2    (S=vt+1/2at²)
        //           1
        // S = v t + — a t²
        //           2
        this.high = this.jumpHigh + (this.jumpPower * this.frame + -this.config.jump.gravity * this.frame * this.frame / 2);
        break;
      case 'DEADING':
      case 'DEAD':
        this.frame++;
        this.high = this.jumpHigh + (this.jumpPower * this.frame + -this.config.jump.gravity * this.frame * this.frame / 2);
        break;
    }
  },
  clear: function() {
    this.els.staying.style.display = 'none';
    this.els.jumping.style.display = 'none';
    this.els.dead.style.display = 'none';
    for (var i = 0; i < this.els.running.length; i++) {
      this.els.running[i].style.display = 'none';
    }
  },
  draw: function() {
    this.clear();
    
    this.els.el.style.display = 'block';
    this.els.el.style.left = (this.location - this.parkour.camera - this.size.width / 2) + 'px';
    this.els.el.style.top = (this.parkour.size.height - this.high - this.size.height) + 'px';

    switch (this.status) {
      case 'READY':
        this.els.staying.style.display = 'block';
        break;
      case 'RUNNING':
        this.els.running[this.frame].style.display = 'block';
        break;
      case 'JUMPING':
        this.els.jumping.style.display = 'block';
        break;
      case 'DEADING':
        this.els.jumping.style.display = 'block';
        break;
      case 'DEAD':
        this.els.dead.style.display = 'block';
        break;
    }
  },
  checkAward: function(award) {
    if (this.status !== 'DEAD') {
      if (Parkour.Utils.hint(this.center(), this.size, award.center(), award.size)) {
        award.get();
      }
    }
  },
  checkTile: function() {
    switch (this.status) {
      case 'RUNNING':
        if (this.left.empty) {  //检查左侧是否再地面上,如果左侧离开了地面并且处于奔跑状态则切换到跳跃状态
          this.jump(0);
        }
        break;
      case 'JUMPING':
        if (!this.right.empty) { //先看右侧是否落地
          if (this.right.size.height >= this.high) { //低于地面了
            if (this.right.type === 'left' && //右脚踏入一个左侧地块
              this.right.location >= this.location + this.size.width / 2 - this.speed && //并且是刚刚踏入
              this.right.size.height - this.high > this.config.jump.power / this.parkour.config.fps  //为踏入地上,而是碰到地面的墙壁
            ) {
              this.status = 'DEADING';
              if (this.uping()) { //如果是上升中,直接下落
                this.jump(0, this.high, this.config.jump.count);
              } else {
                this.jumpCount = this.config.jump.count;
              }
            } else {
              this.status = 'RUNNING';
              this.high = this.right.size.height;
              this.frame = 0;
              if (this.jumping) {
                this.startJump(Math.abs(this.jumping), this.right.size.height)
              }
            }
          }
        } else if (!this.left.empty) { //再检查左侧是否落地
          if (this.left.size.height >= this.high) { //低于地面了表示已落地
            this.status = 'RUNNING';
            this.high = this.left.size.height;
            this.frame = 0;
            if (this.jumping) {
              this.startJump(Math.abs(this.jumping), this.left.size.height)
            }
          }
        }
        break;
    }
  },
  checkEnemy: function(enemy) {
    if (this.status !== 'DEAD' && enemy.status !== 'DEAD') {
      if (Parkour.Utils.hint(this.center(), this.size, enemy.center(), enemy.size)) {
        this.jumping = 0;
        if (this.status !== 'JUMPING' || (Parkour.Utils.hintVer(this.prevCenter(), this.size, enemy.center(), enemy.size) <= 0)) {
          enemy.turn(this.center().x > enemy.center().x ? 1 : -1);
          this.status = 'DEAD';
          this.frame = 0;
          this.jumpHigh = this.high;  //记录起跳位置
          this.jumpPower = this.config.dead.power; //起跳力度
        } else {
          enemy.dead();
          return { rebound: enemy.config.rebound, high: enemy.high + enemy.size.height - (enemy.size.top || 0) };
        }
      }
    }
  },
  nextHigh: function() {
    var nextFrame = this.frame + 1;
    return this.jumpHigh + (this.jumpPower * nextFrame + -this.config.jump.gravity * nextFrame * nextFrame / 2);
  },
  prevHigh: function() {
    if (this.frame === 0) return this.high;
    var prevFrame = this.frame - 1;
    return this.jumpHigh + (this.jumpPower * prevFrame + -this.config.jump.gravity * prevFrame * prevFrame / 2);
  },
  uping: function() {
    return this.nextHigh() > this.high;
  },
  dead: function() {
    return this.high < -this.size.height;
  },
  run: function() {
    this.status = 'RUNNING';
  },
  startJump: function(dpower, high) {
    if (this.status === 'RUNNING') {
      if (!dpower) dpower = this.config.jump.power / 3;
      this.jumping = dpower;
      return this.jump(dpower, high);
    } else {
      this.jumping = -dpower;
    }
    return false;
  },
  stopJump: function() {
    this.jumping = 0;
  },
  jump: function(power, high, count) {
    if (this.status === 'RUNNING') { //只有跑步时可以跳跃
      this.status = 'JUMPING';
      this.frame = 0;
      this.jumpHigh = typeof high === 'undefined' ? this.high : high;  //记录起跳位置
      this.jumpPower = typeof power === 'undefined' ? this.config.jump.power : power; //起跳力度
      this.jumpCount = typeof count === 'undefined' ? 1 : count;
      return true;
    } else if (this.status === 'JUMPING') {
      if (this.jumpCount < this.config.jump.count || typeof count !== 'undefined' && count <= this.config.jump.count) {
        this.frame = 0;
        this.jumpHigh = typeof high === 'undefined' ? this.high : high;  //记录起跳位置
        this.jumpPower = typeof power === 'undefined' ? this.config.jump.power : power; //起跳力度
        if (typeof count === 'undefined') {
          this.jumpCount++;
        } else {
          this.jumpCount = count;
        }
        return true;
      }
    }
    return false;
  },
  center: function() {
    return { x: this.location, y: this.high + this.size.height / 2 };
  },
  nextCenter: function() {
    return { x: this.location + this.speed, y: this.nextHigh() + this.size.height / 2 };
  },
  prevCenter: function() {
    return { x: this.location - this.speed, y: this.prevHigh() + this.size.height / 2 };
  }
}

/**
 * 
 * @param {Parkour} parkour 
 * @param {Number} location 地块的位置
 * @param {Number} index 地块的类型,表示options中tiles的第几种地块
 * @param {Number} type 地块的样式,left/middle/right
 * @param {*} size 地块的尺寸
 * @param {*} assets 地块的图片资源/为空时表示空地快(悬崖)
 */
Parkour.Tile = function(parkour, location, index, type, size, assets) {
  this.parkour = parkour;
  this.location = location;
  this.size = size;
  this.index = index;
  this.type = type;
  this.assets = assets;

  this.flags = [];

  if (this.assets) {
    this.empty = false;
    this.el = this.initElement();
  } else {
    this.empty = true;
  }
}

Parkour.Tile.prototype = {
  initElement: function() {
    var element = this.assets.cloneNode();
    element.style.position = 'absolute';
    element.style.display = 'none';
    element.style.width = this.size.width + 'px';
    element.style.height = this.size.height + 'px';
    element.style.zIndex = Parkour.ZIndex.tile;
    this.parkour.container.appendChild(element);
    return element;
  },
  tick: function() {
    for (var i = 0; i < this.flags.length; i++) {
      this.flags[i].tick();
    }
  },
  draw: function() {
    if (!this.empty) {
      this.el.style.display = 'block';
      this.el.style.top = (this.parkour.size.height - this.size.height) + 'px';
      this.el.style.left = (this.location - this.parkour.camera) + 'px';
    }
    for (var i = 0; i < this.flags.length; i++) {
      this.flags[i].draw();
    }
  },
  destory: function() {
    if (this.location + this.size.width < this.parkour.camera) {
      if (!this.empty) {
        this.parkour.container.removeChild(this.el);
      }
      for (var i = 0; i < this.flags.length; i++) {
        this.flags[i].destory();
      }
      return true;
    } else {
      return false;
    }
  },
  addFlag: function(config, size, assets) {
    this.flags.push(new Parkour.Flag(this.parkour, this, config, size, assets));
  },
  center: function() {
    return { x: this.location + this.size.width / 2, y: this.size.height / 2 };
  }
}

Parkour.Flag = function(parkour, tile, config, size, assets) {
  this.parkour = parkour;
  this.tile = tile;
  this.config = config;
  this.size = size;
  this.assets = assets;

  this.frame = 0;
  this.location = typeof config.location === 'undefined' ? tile.location + tile.size.width / 2 : config.location;  //如果未配置位置则设置地块的中间作为出现位置, 否则使用设置的位置作为出现位置
  this.high = this.config.float ? Math.floor(Math.random() * (this.parkour.size.height - this.size.height)) : tile.size.height; //地块的高度作为标记出现的位置

  this.els = this.initElement();
}

Parkour.Flag.prototype = {
  initElement: function() {
    var flag = document.createElement('div');

    var frames = [];
    for (var i = 0; i < this.assets.length; i++) {
      var frame = this.assets[i].cloneNode();
      frame.style.width = this.size.width + 'px';
      frame.style.height = this.size.height + 'px';
      frame.style.display = 'none';
      flag.appendChild(frame);
      frames.push(frame);
    }

    flag.style.position = 'absolute';
    flag.style.display = 'none';
    flag.style.width = this.size.width + 'px';
    flag.style.height = this.size.height + 'px';
    flag.style.zIndex = Parkour.ZIndex.flag;
    this.parkour.container.appendChild(flag);
    return {
      el: flag,
      frames: frames
    };
  },
  tick: function() {
    this.frame = (this.frame + 1) % this.assets.length;
    if (this.config.float) {
      this.location += this.config.speed;
    }
  },
  clear: function() {
    for (var i = 0; i < this.els.frames.length; i++) {
      this.els.frames[i].style.display = 'none';
    }
  },
  draw: function() {
    this.els.el.style.display = 'block';
    this.els.el.style.top = (this.parkour.size.height - this.high - this.size.height) + 'px';
    this.els.el.style.left = (this.location - this.size.width / 2 - this.parkour.camera) + 'px';
    this.clear();
    this.els.frames[this.frame].style.display = 'block';
  },
  destory: function() {
    this.parkour.container.removeChild(this.els.el);
  }
}

Parkour.Background = function(parkour, location, config, size, assets) {
  this.parkour = parkour;
  this.config = config;
  this.size = size;
  this.assets = assets;

  this.location = location;

  this.speed = this.config.speed(this.parkour.score, +Date.now() - this.parkour.begin);

  this.el = this.initElement();
}

Parkour.Background.prototype = {
  initElement: function() {
    var element = this.assets.cloneNode();
    element.style.position = 'absolute';
    element.style.width = this.size.width + 'px';
    element.style.height = this.size.height + 'px';
    element.style.zIndex = Parkour.ZIndex.background;
    this.parkour.container.appendChild(element);
    return element;
  },
  tick: function() {
    this.speed = this.config.speed(this.parkour.score, +Date.now() - this.parkour.begin);
    this.location += this.speed;
  },
  draw: function() {
    this.el.style.display = 'block';
    this.el.style.left = (this.location - this.parkour.camera) + 'px';
  },
  destory: function() {
    if (this.location + this.size.width < this.parkour.camera) {
      this.parkour.container.removeChild(this.el);
      return true;
    } else {
      return false;
    }
  }
}

Parkour.Award = function(parkour, location, high, config, size, assets) {
  this.parkour = parkour;
  this.location = location;
  this.high = high;
  this.config = config;
  this.size = size;
  this.assets = assets;

  this.frame = 0;

  this.status = 'HOLD';

  this.els = this.initElement();
}

Parkour.Award.prototype = {
  initElement: function() {
    var award = document.createElement('div');

    var normal = [];
    for (var i = 0; i < this.assets.normal.length; i++) {
      var element = this.assets.normal[i].cloneNode();
      element.style.width = this.size.width + 'px';
      element.style.height = this.size.height + 'px';
      element.style.display = 'none';
      award.appendChild(element);
      normal.push(element);
    }

    
    award.style.position = 'absolute';
    award.style.width = this.size.width + 'px';
    award.style.height = this.size.height + 'px';
    award.style.zIndex = Parkour.ZIndex.award;
    award.style.display = 'none';
    this.parkour.container.appendChild(award);


    return {
      el: award,
      normal: normal
    };
  },
  tick: function() {
    this.frame = (this.frame + 1) % this.els.normal.length;
  },
  clear: function() {
    for (var i = 0; i < this.els.normal.length; i++) {
      this.els.normal[i].style.display = 'none';
    }
  },
  draw: function() {
    this.els.el.style.display = 'block';
    this.els.el.style.left = (this.location - this.parkour.camera - this.size.width / 2) + 'px';
    this.els.el.style.top = (this.parkour.size.height - this.high - this.size.height) + 'px';
    this.clear();
    this.els.normal[this.frame].style.display = 'block';
  },
  get: function() {
    this.status = 'GOT';
    this.parkour.addScore(this.config.score);
  },
  destory: function() {
    if (this.location + this.size.width / 2 < this.parkour.camera || this.status === 'GOT') {
      this.parkour.container.removeChild(this.els.el);
      return true;
    } else {
      return false;
    }
  },
  center: function() {
    return { x: this.location, y: this.high + this.size.height / 2 };
  }
}

Parkour.Enemy = function(parkour, tile, direction, config, size, assets) {
  this.parkour = parkour;
  this.tile = tile;
  this.right = tile;
  this.left = tile;
  this.direction = direction;
  this.config = config;
  this.size = size;
  this.assets = assets;

  this.location = tile.location + tile.size.width / 2;
  this.high = tile.size.height;
  this.status = 'RUNNING';
  this.frame = 0;

  this.els = this.initElement();
}

Parkour.Enemy.prototype = {
  initElement: function() {
    var enemy = document.createElement('div');

    var running = [];
    for (var i = 0; i < this.assets.running.length; i++) {
      var r = this.assets.running[i].cloneNode();
      r.style.width = this.size.width + 'px';
      r.style.height = this.size.height + 'px';
      r.style.display = 'none';
      enemy.appendChild(r);
      running.push(r);
    }

    var dead = this.assets.dead.cloneNode();
    dead.style.width = this.size.width + 'px';
    dead.style.height = this.size.height + 'px';
    dead.style.display = 'none';
    enemy.appendChild(dead);


    enemy.style.position = 'absolute';
    enemy.style.width = this.size.width + 'px';
    enemy.style.height = this.size.height + 'px';
    enemy.style.zIndex = Parkour.ZIndex.enemy;
    enemy.style.display = 'none';
    this.parkour.container.appendChild(enemy);
    return {
      el: enemy,
      running: running,
      dead: dead
    }
  },
  tick: function() {
    if (this.status === 'RUNNING') {
      this.location += this.direction;
      this.frame = (this.frame + 1) % this.assets.running.length;
    } else if (this.status === 'JUMPING' || this.status === 'DEAD') {
      this.frame++;
    }
  },
  clear: function() {
    for (var i = 0; i < this.els.running.length; i++) {
      this.els.running[i].style.display = 'none';
    }
    this.els.dead.style.display = 'none';
  },
  draw: function() {
    this.els.el.style.display = 'block';
    this.els.el.style.left = (this.location - this.parkour.camera - this.size.width / 2) + 'px';
    this.els.el.style.top = (this.parkour.size.height - this.high - this.size.height) + 'px';
    this.els.el.style.transform = 'scale(' + this.direction + ',1)';

    this.clear();
    if (this.status === 'RUNNING') {
      this.els.running[this.frame].style.display = 'block';
    } else if (this.status === 'JUMPING') {
      this.els.running[this.frame].style.display = 'block';
    } else if (this.status === 'DEAD') {
      this.els.dead.style.display = 'block';
    }
  },
  checkTile: function() {
    if (this.status === 'RUNNING') {
      if (this.direction > 0) {
        if (this.right && this.right.empty) {
          this.turn();
        }
      } else if (this.direction < 0) {
        if (this.left && this.left.empty) {
          this.turn();
        }
      }
    }
  },
  checkEnemy: function(enemy) {
    if ((this.status !== 'DEAD' || this.config.hold) && (enemy.status !== 'DEAD' || enemy.config.hold)) {
      if (Parkour.Utils.hint(this.center(), this.size, enemy.center(), enemy.size)) {
        var direction = this.location > enemy.location ? 1 : -1;
        if (direction === enemy.direction) {
          enemy.turn();
        }
        if (direction !== this.direction) {
          this.turn();
        }
      }
    }
  },
  dead() {
    this.status = 'DEAD';
  },
  turn(direction) {
    if (typeof direction === 'undefined') {
      this.direction = -this.direction;
    } else {
      this.direction = direction;
    }
  },
  destory: function() {
    if (this.location + this.size.width / 2 < this.parkour.camera || this.high < -this.size.height) {
      this.parkour.container.removeChild(this.els.el);
      return true;
    } else {
      return false;
    }
  },
  center: function() {
    return { x: this.location, y: this.high + this.size.height / 2 };
  }
}