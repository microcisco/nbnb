# 微信小程序动画引擎
本项目是为一套简单的小程序动画库 整体实现参考的cocos，API设置参考了cocos和laya
目前只支持本地图片和label渲染，后面有空再添加

## 快速使用
```js
const winSize = require("../../utils/util").getWinSize();
let nbnb = require("../../utils/nbnb.js");     //引入
let context = wx.createCanvasContext('gameStage');
nbnb.init(context, 0, 0, winSize.width, winSize.height); //初始化
//new一个显示显示fps的label
var fps = new nbnb.Node(0, 0, 0, 0);    //new Node
fps.setPosition(0, 0);                  //设置坐标
nbnb.stage.addChild(fps);               //添加到舞台
fps.update = function (dt) {            //重写update每帧更新  dt是上一帧执行的时间
    fps.setString("fps: " + (1000 / dt).toFixed(0));
};
```
## 类
> Rect  类似ios中的frame用于确定坐标和尺寸\
> Ver2  可以用来确定坐标或者尺寸\
>Point  可以用来确定坐标\
>Node   待渲染的item\
>Action 执行的动作的描述
## API
###Node
> addChild  添加子元素\
> removeChildByName  移除子元素通过名字\
> removeFromParent  从父元素中移除\
> removeAllChildren  移除所有子元素\
> setName  设置名字\
> setScale  设置缩放\
> setPosition  设置坐标\
> setAnchor  设置锚点\
> runAction  执行action\
> stopAction  停止action\
> stopAllActions  停止所有action\
> destroy  销毁\
> setTexture  设置材质\
> setString  设置文字\
> clearTexture  清除材质\
> eventTouch  接受canvas事件 >>只能由系统触发\
> bindEvent  绑定事件\
> getBoundingBox  获取碰撞box
###Action
```js
/**
 * action
 * @param option {x: y: scaleX: scaleY: }  选项
 * @param duration   持续时间
 * @param cb         执行完回调
 * */
```
###Event
```js
//Page类里面需要添加这个方法
bindtap: function (e) {
    nbnb.stage.eventTouch(e);
}
//node绑定点击事件回调函数
img.bindEvent(nbnb.Events.TAP, this.cardTouched);
```