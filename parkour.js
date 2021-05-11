

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

  function initImage(image) {
    if (typeof image === 'string') {
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
    if (!assets.protagonist.running || !assets.protagonist.running.length) throw '必须配置主角奔跑图片';
    for (var i = 0; i < assets.protagonist.running.length; i++) assets.protagonist.running[i] = initImage(assets.protagonist.running[i]);
    if (!assets.protagonist.jumping) throw '必须配置主角跳跃图片';
    assets.protagonist.jumping = initImage(assets.protagonist.jumping);
    if (!assets.protagonist.staying) throw '必须配置主角跳跃图片';
    assets.protagonist.staying = initImage(assets.protagonist.staying);
    if (!assets.background || !assets.background.length) throw '必须配置背景图';
    for (var i = 0; i < assets.background.length; i++) assets.background[i] = initImage(assets.background[i]);
    if (!assets.tiles || !assets.tiles.length) throw '必须配置地块';
    for (var i = 0; i < assets.tiles.length; i++) {
      var tile = assets.tiles[i];
      if (!tile.left || !tile.left.length) throw '必须配置地块左侧图片';
      for (var j = 0; j < tile.left.length; j++) tile.left[j] = initImage(tile.left[j]);
      if (!tile.middle || !tile.middle.length) throw '必须配置地块中间图片';
      for (var j = 0; j < tile.middle.length; j++) tile.middle[j] = initImage(tile.middle[j]);
      if (!tile.right || !tile.right.length) throw '必须配置地块右侧图片';
      for (var j = 0; j < tile.right.length; j++) tile.right[j] = initImage(tile.right[j]);
    }
    if (!assets.awards || !assets.awards.length) throw '必须配置奖品图片'
    for (var i = 0; i < assets.awards.length; i++) assets.awards[i].normal = initImage(assets.awards[i].normal);
  }

  function initConfig(config) {
    if (!config.fps) throw '必须配置帧率';
    if (!config.protagonist) throw '必须设置主角配置';
    if (!config.protagonist.run) throw '必须设置主角奔跑配置';
    if (!config.protagonist.run.speed) throw '必须配置主角奔跑速度';
    if (typeof config.protagonist.run.speed === 'number') {
      var speed = config.protagonist.run.speed;
      config.protagonist.run.speed = function() {
        return speed;
      };
    }
    if (!config.protagonist.run.start) throw '必须配置主角起跑位置';
    if (!config.protagonist.jump) throw '必须设置主角配置配置';
    if (!config.win) throw '必须设置胜利条件';
  }
  
  this.options = options || {};
  initSize(this.options.size);
  initAssets(this.options.assets);
  initConfig(this.options.config);

  this.container = initContainer(container, this.options.size.container);

  this.size = this.options.size.container;
  this.begin = 0;
  this.score = 0;
  this.camera = 0; //相机位置

  this.checkTiles();
  this.checkProtagonist();
  this.checkAwards();
  this.checkBackgrounds();
  
  // this.resize(this.options.container.clientWidth, this.options.container.clientHeight);
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
  }
}

Parkour.prototype = {
  // resize: function(width, height) {

  // },
  inited: function() {
    this.status = 'INITED';
    this.draw();
    this.onInited && this.onInited();
  },
  isPlaying() {
    return this.status === 'PLAYING';
  },
  isInited() {
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

    this.ticker = setInterval(function() {

      _this.tick();
      
      _this.checkTiles();
      _this.checkProtagonist();
      _this.checkAwards();
      _this.checkBackgrounds();

      var result = _this.check();

      _this.draw();

      if (typeof result !== 'undefined') {
        clearInterval(_this.ticker);
        setTimeout(function() {
          if (result) {
            _this.onWin && _this.onWin();
          } else {
            _this.onLose && _this.onLose();
          }
        })
      }
    }, Math.floor(1000 / this.options.config.fps));
  },
  tick: function() {
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
  },
  check: function() {
    this.protagonist.check();
    for (var i = 0; i < this.awards.length; i++) {
      if (this.protagonist.checkAward(this.awards[i])) {
        this.awards[i].get();
      }
    }
    if (this.score >= this.options.config.win.score || (+Date.now() - this.begin) >= this.options.config.win.time) {
      return true;
    } else if (this.protagonist.dead()) {
      return false;
    }
  },
  jump: function() {  //跳跃
    this.protagonist.jump();
  },
  findTile: function(location) {
    for (var i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i].location <= location && this.tiles[i].location + this.tiles[i].size.width > location) {
        return this.tiles[i];
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
  checkTiles: function() {
    if (!this.tiles) this.tiles = [];
    var lastTile = this.tiles[this.tiles.length - 1];
    var tileWidth = this.options.size.tile.width;
    while(!this.tiles.length || lastTile.location < this.camera + this.options.size.container.width) {
      var tile;
      if (!lastTile) {  //没有前一个地块,表示第一个地块
        tile = new Parkour.Tile(this, 0, 0, 'middle', { width: tileWidth, height: this.options.size.tiles[0].height }, Parkour.Utils.random(this.options.assets.tiles[0].middle));
      } else {
        var tileLocation = lastTile.location + tileWidth;
        if (tileLocation < this.options.size.container.width) {  //第一屏的地块
          tile = new Parkour.Tile(this, tileLocation, 0, 'middle', { width: tileWidth, height: this.options.size.tiles[0].height }, Parkour.Utils.random(this.options.assets.tiles[0].middle));
        } else {
          if (lastTile.empty) { //前一个地块时空地块(悬崖)
            var tileIndex = Math.floor(this.options.size.tiles.length * Math.random());
            tile = new Parkour.Tile(this, tileLocation, tileIndex, 'left', { width: tileWidth, height: this.options.size.tiles[tileIndex].height }, Parkour.Utils.random(this.options.assets.tiles[tileIndex].left));
          } else {
            switch(lastTile.type) {
              case 'middle':
                if (Math.random() < 0.2) {
                  tile = new Parkour.Tile(this, tileLocation, lastTile.index, 'right', { width: tileWidth, height: this.options.size.tiles[lastTile.index].height }, Parkour.Utils.random(this.options.assets.tiles[lastTile.index].right));
                } else {
                  tile = new Parkour.Tile(this, tileLocation, lastTile.index, 'middle', { width: tileWidth, height: this.options.size.tiles[lastTile.index].height }, Parkour.Utils.random(this.options.assets.tiles[lastTile.index].middle));
                }
                break;
              case 'left':
                tile = new Parkour.Tile(this, tileLocation, lastTile.index, 'middle', { width: tileWidth, height: this.options.size.tiles[lastTile.index].height }, Parkour.Utils.random(this.options.assets.tiles[lastTile.index].middle));
                break;
              case 'right':
                tile = new Parkour.Tile(this, tileLocation, 0, '', { width: tileWidth, height: this.options.size.tiles[lastTile.index].height });
                break;
            }
          }
        }
      }
      this.tiles.push(tile);
      lastTile = tile;
    }
    Parkour.Utils.remove(this.tiles, function(tile) {
      return tile.destory();
    });
  },
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
  checkBackgrounds: function() {
    if (!this.backgrounds) this.backgrounds = [];
  },
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
  this.tile = this.right = this.left = tile;
  this.config = config;
  this.size = size;
  this.assets = assets;

  this.frame = 0;
  this.status = 'READY';

  this.container = this.container;

  this.location = this.config.run.start;  //主角当前的位置
  this.high = tile.size.height; //主角高度=地块的高度
  this.speed = this.config.run.speed(0, 0); //主角的移动速度(撞墙后停止)
  
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

    protagonist.style.position = 'absolute';
    protagonist.style.width = this.size.width + 'px';
    protagonist.style.height = this.size.height + 'px';
    this.parkour.container.appendChild(protagonist);
    return {
      el: protagonist,
      staying: staying,
      running: running,
      jumping: jumping
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
        this.frame++;
        this.high = this.jumpHigh + (this.jumpPower * this.frame + -this.config.jump.gravity * this.frame * this.frame / 2);
        break;
    }
  },
  clear: function() {
    this.els.staying.style.display = 'none';
    this.els.jumping.style.display = 'none';
    for (var i = 0; i < this.els.running.length; i++) {
      this.els.running[i].style.display = 'none';
    }
  },
  draw: function() {
    this.clear();
    
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
    }
  },
  check: function() {
    switch (this.status) {
      case 'RUNNING':
        if (this.left.empty) {
          this.status = 'JUMPING';
          this.frame = 0;
          this.jumpHigh = this.high;  //记录起跳位置
          this.jumpPower = 0; //起跳力度
        }
        break;
      case 'JUMPING':
        if (!this.right.empty) {
          if (this.right.size.height >= this.high) { //低于地面了
            if (this.right.type === 'left' && this.right.location >= this.location + this.size.width / 2 - this.speed && this.right.size.height - this.high > this.config.jump.power / this.parkour.options.config.fps) {
              this.status = 'DEADING';
            } else {
              this.status = 'RUNNING';
              this.high = this.right.size.height;
              this.frame = 0;
            }
          }
        }
        break;
    }
  },
  checkAward: function(award) {
    return this.location + this.size.width / 2 > award.location - award.size.width / 2 && this.location - this.size.width / 2 < award.location + award.size.width / 2 &&
      this.high + this.size.height > award.high && this.high < award.high + award.size.height;
  },
  dead: function() {
    return this.high < -this.size.height;
  },
  run: function() {
    this.status = 'RUNNING';
  },
  jump: function() {
    if (this.status === 'RUNNING') { //只有跑步时可以跳跃
      this.status = 'JUMPING';
      this.frame = 0;
      this.jumpHigh = this.high;  //记录起跳位置
      this.jumpPower = this.config.jump.power; //起跳力度
    }
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
    element.style.width = this.size.width + 'px';
    element.style.height = this.size.height + 'px';
    this.parkour.container.appendChild(element);
    return element;
  },
  tick: function() {
    
  },
  draw: function() {
    if (!this.empty) {
      this.el.style.top = (this.parkour.size.height - this.size.height) + 'px';
      this.el.style.left = (this.location - this.parkour.camera) + 'px';
    }
  },
  destory: function() {
    if (this.location + this.size.width < this.parkour.camera) {
      if (!this.empty) {
        this.parkour.container.removeChild(this.el);
      }
      return true;
    } else {
      return false;
    }
  }
}

Parkour.Background = function(parkour, config, size, assets) {
  this.parkour = parkour;
  this.config = config;
  this.size = size;
  this.assets = assets;
}

Parkour.Background.prototype = {
  tick: function() {
    
  },
  draw: function() {

  }
}

Parkour.Award = function(parkour, location, high, config, size, assets) {
  this.parkour = parkour;
  this.location = location;
  this.high = high;
  this.config = config;
  this.size = size;
  this.assets = assets;

  this.status = 'HOLD';

  this.el = this.initElement();
}

Parkour.Award.prototype = {
  initElement: function() {
    var element = this.assets.normal.cloneNode();
    element.style.position = 'absolute';
    element.style.width = this.size.width + 'px';
    element.style.height = this.size.height + 'px';
    this.parkour.container.appendChild(element);
    return element;
  },
  tick: function() {

  },
  draw: function() {
    this.el.style.left = (this.location - this.parkour.camera - this.size.width / 2) + 'px';
    this.el.style.top = (this.parkour.size.height - this.high - this.size.height) + 'px';
  },
  get: function() {
    this.status = 'GOT';
    this.parkour.addScore(this.config.score);
  },
  destory: function() {
    if (this.location + this.size.width / 2 < this.parkour.camera || this.status === 'GOT') {
      this.parkour.container.removeChild(this.el);
      return true;
    } else {
      return false;
    }
  }
}