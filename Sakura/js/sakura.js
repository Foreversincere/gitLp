var renderer={//渲染器
    init_cherry_blossom_count:30,//初始化樱花数目
    max_adding_interval:10,//添加最大的时间间隔
    init:function () {//初始化属性
        this.SetParameters();//设置樱花飘落的属性参数
        this.ReconstructMethods();//重建Render渲染方法
        this.CreateCherries();//创建樱花
        this.Render();//渲染樱花
    },
    SetParameters:function () {
        this.$container=$('#sakura');
        this.width= this.$container.width();//宽
        this.height=this.$container.height();//高
        //设置上下文为一个2d的画布
        this.context=$('<canvas />').attr({width:this.width,height:this.height}).appendTo(this.$container).get(0).getContext('2d');
        this.Cherries=[];//设置一个樱花数组
        this.MaxAddingInterval=Math.round(this.max_adding_interval*1000/this.width);//用Math对象的round属性（四舍五入）设置樱花飘落的最大时间间隔
        this.AddingInterval=this.MaxAddingInterval;//设置时间间隔为最大时间间隔
    },
    ReconstructMethods:function () {
        this.Render=this.Render.bind(this);//用bind绑定属性解决this作用域问题
    },
    CreateCherries:function () {
        for (var i=0,length=Math.round(this.init_cherry_blossom_count *  this.width / 1000);i<length;i++){
            this.Cherries.push(new cherry_blossom(this,true));//在樱花数组尾部添加
        }
    },
    Render:function () {
        requestAnimationFrame(this.Render);//下次重绘樱花之前调用指定的回调函数新动画
        this.context.clearRect(0,0,this.width,this.height);//通过html canvas clearRect方法清除画布中的内容
        this.Cherries.sort(function (cherry1,cherry2) {//通过排序函数对樱花数组排序
            return cherry1.z - cherry2.z;
        });
        for (var i = this.Cherries.length - 1; i>=0;i--) {
            if (!this.Cherries[i].Render(this.context)) {//当this.Cherries[i].Render(this.context)为false时也就是第i个樱花不在画布里删除元素
                this.Cherries.splice(i,1);//删除第i个元素
            }
        }
        if(--this.AddingInterval===0){//判断时间减去1之后是否为0，为0执行，不为0不执行
            this.AddingInterval=this.MaxAddingInterval;//重设时间间隔
            this.Cherries.push(new cherry_blossom(this,false));//添加樱花
        }
    }
};
var cherry_blossom=function(Renderer,isRandom){
    this.Renderer=Renderer;
    this.init(isRandom);
};
cherry_blossom.prototype={//通过prototype给樱花添加属性和方法
    focus_position:300,//设置樱花的焦点位置
    far_limit:600,//视距，眼睛看樱花的距离
    max_ripple_count:100,//设置樱花落下的最大波纹数
    ripple_radius:100,//设置波纹的半径
    surface_rate:0.5,//波纹浮出表面的时间
    sink_offset:20,//波纹出现的地点与樱花落入水面相距20

    init:function (isRandom) {
        this.x=this.getRandomValue(-this.Renderer.width,this.Renderer.width);//樱花落入水面的地点
        this.y=isRandom ? this.getRandomValue(0,this.Renderer.height) : this.Renderer.height*1.5;//樱花开始掉落的地点
        this.z=this.getRandomValue(0,this.far_limit);//樱花落入 y 轴的地点
        this.Vx=this.getRandomValue(-2,2);//樱花落在x上的地点
        this.Vy=-2;//樱花在z轴上移动的方向
        this.theta=this.getRandomValue(0,Math.PI*10);//与水面形成的夹角
        this.Phi=this.getRandomValue(0,Math.PI*2);
        this.psi=0;
        this.dpsi=this.getRandomValue(Math.PI / 600 , Math.PI / 300);
        this.opacity=0;//水面映射出的樱花透明度
        this.endTheta=false;
        this.endPhi=false;
        this.rippleCount=0;//设置开始波纹的数目

        var axis=this.getAxis(),
            //Math.ceil向上取整
            theta=this.theta+Math.ceil(-(this.y+this.Renderer.height*this.surface_rate)/this.Vy)*Math.PI/500;
        theta %= Math.PI*2;

        this.offsetY = 40*((theta <= Math.PI / 2 || theta >= Math.PI * 3 / 2) ? -1 : 1);
        this.thresholdY=this.Renderer.height/2+this.Renderer.height*this.surface_rate*axis.rate;
        this.entityColor=this.Renderer.context.createRadialGradient(0,40,0,0,40,80);//创建樱花的放射状/圆形渐变对象
        this.entityColor.addColorStop(0,'hsl(330,70%, '+50*(0.3+axis.rate)+'%)');//开始落入时樱花的颜色
        this.entityColor.addColorStop(0.05, 'hsl(330, 40%,' + 55 * (0.3 + axis.rate) + '%)');//落入途中樱花的颜色
        this.entityColor.addColorStop(1, 'hsl(330, 20%,' + 70 * (0.3 + axis.rate) + '%)');//结束时樱花的颜色
        this.shadowColor=this.Renderer.context.createRadialGradient(0 , 40, 0, 0, 40, 80);//创建投影樱花的放射状/圆形渐变对象
        this.shadowColor.addColorStop(0,'hsl(330,40%, '+30*(0.3+axis.rate)+'%)');//开始落入时投影樱花的颜色
        this.shadowColor.addColorStop(0.05, 'hsl(330, 40%,' + 30 * (0.3 + axis.rate) + '%)');//落入途中投影樱花的颜色
        this.shadowColor.addColorStop(1, 'hsl(330, 20%,' + 40 * (0.3 + axis.rate) + '%)');//结束时投影樱花的颜色
    },
    getRandomValue:function (min,max) {
        return min+ (max-min) * Math.random();//返回一个随机数
    },
    getAxis : function () {
        var rate=this.focus_position / (this.z + this.focus_position),
            x = this.Renderer.width / 2 + this.x * rate,
            y = this.Renderer.height / 2 - this.y * rate;
        return {rate : rate ,x : x, y : y};//返回一个对象
    },
    RenderCherry:function (context,axis) {//绘制樱花
        context.beginPath();//绘制路径
        context.moveTo(0, 40);//把路径移动到画布中的指定点，不创建线条
        context.bezierCurveTo(-60, 20, -10, -60, 0, -20);//创建三次方贝塞尔曲线
        context.bezierCurveTo(10, -60, 60, 20, 0, 40);
        context.fill();//填充当前路径

        for(var i=-4;i<4;i++){//绘制花瓣纹路
            context.beginPath();//绘制路径
            context.moveTo(0,40);//把路径移动到画布中的指定点，不创建线条
            context.quadraticCurveTo(i * 12 , 10, i * 4, -24 + Math.abs(i) *2);//绘制一条二次贝塞尔曲线，Math.abs返回绝对值
            context.strokeStyle= 'rgba(255,255,255,0.25)';//纹路颜色及透明度
            context.stroke();//绘制当前路径
        }
    },

    /**
     * @return {boolean}
     */
    Render:function (context) {
        var axis=this.getAxis();

        if (axis.y===this.thresholdY && this.rippleCount < this.max_ripple_count){
            context.save();//保存落在水面的樱花状态
            context.lineWidth=2;//设置波纹的边框大小
            //通过hsla使用色相、饱和度、亮度、透明度来定义波纹颜色。
            context.strokeStyle= 'hsla(0,0%,100%,'+(this.max_ripple_count - this.rippleCount)/this.max_ripple_count+')';
            context.translate(axis.x+this.offsetY*axis.rate*(this.theta<=Math.PI?-1:1),axis.y);//绘制投影樱花
            context.scale(1,0.3);//设置波纹缩放大小
            context.beginPath();//绘制圆的路径
            //绘制圆
            context.arc(0, 0, this.rippleCount/this.max_ripple_count*this.ripple_radius*axis.rate, 0,Math.PI*2,false);
            context.stroke();//画实际的圆
            context.restore();//返回之前保存过的路径状态和属性
            this.rippleCount++;
        }
        if (axis.y< this.thresholdY || (!this.endTheta || !this.endPhi)){
            if (this.y<=0){//随着樱花下落的高度来设置倒影中的樱花透明度
                this.opacity=Math.min(this.opacity + 0.01 , 1);//设置两s数中最小的数
            }
            context.save();//保存投影的樱花状态
            context.globalAlpha=this.opacity;//设置樱花透明度
            context.fillStyle=this.shadowColor;//填充投影樱花的颜色
            context.strokeStyle='hsl(330,30%,'+ 40*(0.3+axis.rate) +'%)';//通过色相、饱和度、亮度来定义投影樱花的颜色
            context.translate(axis.x,Math.max(axis.y,this.thresholdY + this.thresholdY -axis.y));//重新设置樱花映射在画布上的位置
            context.rotate(Math.PI-this.theta);//设置樱花旋转的角度
            context.scale(axis.rate * -Math.sin(this.Phi), axis.rate);
            context.translate(0,this.offsetY);
            this.RenderCherry(context,axis);//调用绘制樱花的属性函数
            context.restore();//返回之前保存过的路径状态和属性
        }
        context.save();
        context.fillStyle=this.entityColor;
        context.strokeStyle='hsl(330,40%,'+70*(0.3+axis.rate)+')';
        context.translate(axis.x,axis.y+Math.abs(this.sink_offset*Math.sin(this.psi)*axis.rate));//math.abs返回绝对值
        context.rotate(this.theta);//设置樱花旋转的角度
        context.scale(axis.rate*Math.sin(this.Phi),axis.rate);
        context.translate(0,this.offsetY);
        this.RenderCherry(context,axis);
        context.restore();
        if (this.y<=-this.Renderer.height/4){
            if (!this.endTheta){
                for (var theta=Math.PI/2,end=Math.PI*3/2;theta<=end;theta+=Math.PI){
                    if (this.theta<theta&&this.theta+Math.PI/200>theta){
                        this.theta=theta;
                        this.endTheta=true;
                        break;
                    }
                }
            }
            if (!this.endPhi){
                for (var Phi=Math.PI/8,end=Math.PI*7/8;Phi<=end;Phi+=Math.PI*3/4){
                    if (this.Phi<Phi&&this.Phi+Math.PI/200>Phi){
                        this.Phi=Math.PI/8;
                        this.endPhi=true;
                        break;
                    }
                }
            }
        }
        if (!this.endTheta){
            if (axis.y===this.thresholdY){
                this.theta += Math.PI / 200 * ((this.theta<Math.PI / 2||(this.theta>=Math.PI&&this.theta<Math.PI*3/2))?1:-1);
            }else {
                this.theta += Math.PI/500;
            }
            this.theta %= Math.PI*2;
        }
        if (this.endPhi){
            if (this.rippleCount===this.max_ripple_count){
                this.psi += this.dpsi;
                this.psi %= Math.PI*2;
            }
        }else {
            this.Phi += Math.PI/((axis.y===this.thresholdY) ? 200 : 500);
            this.Phi %= Math.PI;
        }
        if (this.y<=-this.Renderer.height*this.surface_rate){
            this.x += 2;
            this.y = -this.Renderer.height*this.surface_rate;
        }else {
            this.x += this.Vx;
            this.y += this.Vy;
        }
        return this.z > -this.focus_position && this.z < this.far_limit && this.x < this.Renderer.width * 1.5;
    }
};

$(function () {
    renderer.init();
});