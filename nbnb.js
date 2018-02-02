const util = require("./util.js");
const fps = 30;    //帧数

let ctx = null;     //canvas上下文
let stage = null;   //舞台
let delta = 0;      //每帧执行时间
let listenEventNodeTable = {};    ///监听事件的节点列表   ｛'tap: [node]'｝
/**
 * 矩形
 * */
function Rect(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}

/**
 * 矢量
 * */
function Ver2(x, y) {
	this.x = x;
	this.y = y;
}

/**
 *坐标
 * */
function Point(x, y) {
	this.x = x;
	this.y = y;
}

/**
 * node容器
 * */
function Node(x, y, w, h) {
	this.name = '';
	this.scaleX = 1;
	this.scaleY = 1;
	this.anchorX = 0.5;
	this.anchorY = 0.5;
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;

	//action对象
	this._action = null;
	//text内容
	this._text = '';
	this.fontSize = 20;
	this.color = '#000000';
	//材质路径
	this._texture = '';
	//父元素
	this._parent = null;
	//所有子元素
	this.children = [];
}

//node父类方法
Node.prototype = {
	// //action对象
	// _action: null,
	// //材质路径
	// _texture: null,
	// //父元素
	// _parent: null,
	// //所有子元素
	// children: [],


	//添加子元素
	addChild: function (node) {
		node._parent = this;
		this.children.push(node);
	},
	//移除子元素通过名字
	removeChildByName: function (name) {

	},
	//从父元素中移除
	removeFromParent: function () {

	},
	//移除所有子元素
	removeAllChildren: function () {

	},
	//设置名字
	setName: function (name) {
		this.name = name;
	},
	//设置缩放
	setScale: function (ver2) {
		this.scaleX = ver2.x;
		this.scaleY = ver2.y;
	},
	//设置坐标
	setPosition: function (ver2) {
		this.x = ver2.x;
		this.y = ver2.y;
	},
	//设置锚点
	setAnchor: function (ver2) {
		this.anchorX = ver2.x;
		this.anchorY = ver2.y;
	},
	//执行action
	runAction: function (action) {
		this._action = {
			//设置的action
			injAction: action,
			//update处理action需要的参数
			runningActionParam: {}
		};
		//计算每帧参数变化
		for (let key in this._action.injAction) {
			if (
				this._action.injAction.hasOwnProperty(key) &&
				this.hasOwnProperty(key)
			) {
				//{updateExec: 每帧执行 target:目标参数}
				this._action.runningActionParam[key] = {
					updateExec: (this._action.injAction[key] - this[key]) / this._action.injAction.duration,
					target: this._action.injAction[key]
				};
			}
		}
	},
	//停止action
	stopAction: function (action) {

	},
	//停止所有action
	stopAllActions: function () {

	},
	//销毁
	destroy: function () {
		//移除事件
		for(let key in listenEventNodeTable) {
			if(listenEventNodeTable.hasOwnProperty(key)) {
				if(
					Array.isArray(listenEventNodeTable[key]) &&
					listenEventNodeTable[key].indexOf(this) !== -1
				) {
					listenEventNodeTable[key].splice(listenEventNodeTable[key].indexOf(this), 1);
				}
			}
		}
	},
	//帧循环回调
	_update: function (dt) {
		//action部分处理
		if (this._action) {
			for (let key in this._action.runningActionParam) {
				if (this._action.runningActionParam.hasOwnProperty(key)) {
					this[key] += this._action.runningActionParam[key]['updateExec'] * dt;
					if (
						this._action.runningActionParam[key]['updateExec'] > 0 &&
						this[key] >= this._action.runningActionParam[key]['target']
					) {
						//正方向
						this[key] = this._action.runningActionParam[key]['target'];
						delete this._action.runningActionParam[key];
					}
					else if (
						this._action.runningActionParam[key]['updateExec'] < 0 &&
						this[key] <= this._action.runningActionParam[key]['target']
					) {
						//正方向
						this[key] = this._action.runningActionParam[key]['target'];
						delete this._action.runningActionParam[key];
					}
					//action执行完 && 回收 && 执行回调
					if (Object.keys(this._action.runningActionParam).length === 0) {
						let cb = this._action.injAction.cb;
						this._action = null;
						cb && cb(this);
						return;
					}
				}
			}
		}
		//=========================================================
		//用户重写update && 执行update
		if (typeof this.update === 'function') this.update(dt);
		//调子节点update
		for (let i = 0, l = this.children.length; i < l; ++i) {
			this.children[i]._update(dt);
		}
	},
	//设置材质
	setTexture: function (path) {
		this._texture = path;
	},
	//设置文字
	setString: function (string) {
		this._text = string;
	},
	//清除材质
	clearTexture: function () {
		this._texture = null;
	},
	//渲染
	draw: function () {
		//首先渲染自己
		if (this._texture) {
			let x = this.x - this.anchorX * this.w;
			let y = this.y - this.anchorY * this.h;
			let w = this.w;
			let h = this.h;
			if (this.scaleX !== 1) {
				w *= this.scaleX;
				x -= (w - this.w) * this.anchorX;
			}
			if (this.scaleY !== 1) {
				h *= this.scaleY;
				y -= (h - this.h) * this.anchorY;
			}
			ctx.drawImage(this._texture, x, y, w, h);
		} else if(
			typeof this._text === 'string' &&
			this._text.length > 0
		) {
			ctx.save();
			ctx.setFontSize(this.fontSize);
			ctx.setTextBaseline('top');
			ctx.setFillStyle(this.color);
			ctx.fillText(this._text, this.x, this.y);
			ctx.restore()
		}
		//然后渲染子元素
		for (let i = 0, l = this.children.length; i < l; ++i) {
			this.children[i].draw();
		}
	},
	//接受canvas事件 >>只能由系统触发
	eventTouch: function (e) {
		switch (e.type) {
			case 'tap':
				if (
					Array.isArray(listenEventNodeTable['tap']) &&
					listenEventNodeTable['tap'].length > 0
				) {
					for (let i = 0, l = listenEventNodeTable['tap'].length; i < l; ++i) {
						if(util.containPoint(listenEventNodeTable['tap'][i].getBoundingBox(), e.detail)) {
							typeof listenEventNodeTable['tap'][i]['_bind_tap'] === 'function' && listenEventNodeTable['tap'][i]['_bind_tap'](listenEventNodeTable['tap'][i]);
						}
					}
				}
				break;
		}
	},
	//绑定事件
	bindEvent: function (type, cb) {
		if(!Array.isArray(listenEventNodeTable[type])) {
			listenEventNodeTable[type] = [];
		}
		if(listenEventNodeTable[type].indexOf(this) === -1) {
			listenEventNodeTable[type].push(this);
		}
		this['_bind_' + type] = cb;
	},
	//获取碰撞box
	getBoundingBox: function () {
		let x = this.x + stage.x;
		let y = this.y + stage.y;
		let w = this.w * this.scaleX;
		let h = this.h * this.scaleY;
		x -= w * this.anchorX;
		y -= h * this.anchorX;
		return new Rect(x, y, w, h);
	}
};

/**
 * action
 * @param option {x: y: scaleX: scaleY: }  选项
 * @param duration   持续时间
 * @param cb         执行完回调
 * */
function Action(option, duration, cb) {
	if (option.x !== void 0) this.x = option.x;
	if (option.y !== void 0) this.y = option.y;
	if (option.scaleX !== void 0) this.scaleX = option.scaleX;
	if (option.scaleY !== void 0) this.scaleY = option.scaleY;
	if (typeof cb === 'function') this.cb = cb;
	if (!(duration > 0)) {
		this.duration = 1;
	} else {
		this.duration = duration;
	}
}

function Nbnb() {
}
//NBNB模块的父类方法
Nbnb.prototype = {
	//canvas上下文
	ctx: null,
	//舞台
	stage: null,
	//是否初始化
	_init: false,
	//初始化
	init: function (context, originX, originY, winWidth, winHeight) {
		if (this._init) return;
		this._init = true;
		this.ctx = ctx = context;
		//创建舞台
		stage = this.stage = new Node(originX, originY, winWidth, winHeight);
		//开启帧循环
		/*
		let t = Date.now();
		this.FrameLoop = setInterval(() => {

			if(this.sb !== 1) {
				return;
			}

			//从舞台结点开始渲染
			// this.stage.draw();
			// this.ctx.draw();

            for (let i = 0, l = this.stage.children.length; i < l; ++i) {
                this.stage.children[i].draw();
            }

            this.sb = 0;
            this.ctx.draw(false, ()=>{
            	this.sb = 1;
			});

			delta = Date.now() - t;
			t = Date.now();
			//执行每个node的update
			this.stage._update(delta);
		}, 1000 / fps);
        this.sb = 1;
        */

        //
        let FrameLoop = ()=>{
        	this.sTime = Date.now();
            for (let i = 0, l = this.stage.children.length; i < l; ++i) {
                this.stage.children[i].draw();
            }
            this.ctx.draw(false, ()=>{
                let now = Date.now();
                delta = now - this.sTime;
                this.sTime = now;

                //执行每个node的update
                this.stage._update(delta);

                setTimeout(()=>{
                    FrameLoop();
                }, 50);

            });
		};

        FrameLoop();


	},
	//卸载
    unLoad: function () {
        this._init = false;
        stage = null;
        this.stage = null;
        if(this.FrameLoop) {
        	clearInterval(this.FrameLoop);
            this.FrameLoop = null;
		}
    },
	//各种类原型
	// nodeProto: util.deepCopy(Node.prototype),
	//事件
	Events: {
		TAP: 'tap'    //点击事件

	},
	//暴露函数
	Node: Node,
	Ver2: Ver2,
	Action: Action,
	Rect: Rect


};
let nbnb = new Nbnb();
module.exports = nbnb;