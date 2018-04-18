
var camera, scene, renderer, controls;
var isLoading = true;
var texture = {
    colorMap: null,
    bumpMap: null,
    stroke: null,
    specMap: null
}

var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

/*var mapSize = {
    width: 4096*2,
    height: 2048*2
};*/

var mapSize = {
    width: 2048*5,
    height: 1024*5
};
var mapCanvas, mapTexture;

//cloud
var tilt = 0.41;
var cloudsScale = 1.005;
var moonScale = 0.23;

var lineColor = 0x5dd8d8;
var colorArray = [ new THREE.Color( 0xff0080 ), new THREE.Color( 0xffffff ), new THREE.Color( 0x8000ff ) ];
var lineWidth = 20;
var lineHeight = 0.23;

//飞线(样条曲线：CatmullRomCurve3)路径数组
var spline_curves = []
//飞线(每条样条曲线CatmullRomCurve3中点的数目)长度数组
var trail_flight_distance = []
//每次飞行动画起始结束时间
var flight_start_time = []
var flight_end_time = []

var trail_points = []     //飞线点

var trail_paths = []      //飞线路径
var ml_arr = []

var clock = new THREE.Clock();

var lines = [];
var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
var strokeTexture;

/*
 * 显示控制变量
 * */

var radius = 10;
var segments = 32;
//飞线点数量
var trail_points_num = 200;
//飞线轨迹点数量
var trail_path_points_num = 600;
// 飞线路径数量
var trail_path_count = 0;
var timer = 0;
//加载状态
//显示比例
var aspect = window.innerWidth / window.innerHeight;

//maptalk数据
var defaultCity = ["ZYHB","ZYTX","ZYCC","ZBHH","ZBSJ","ZBYN","ZSJN","ZSOF","ZSCN","ZLXN","ZSFZ","ZLLL","ZJSY","ZULS","ZLIC","ZGNN","ZUGY"]
var airports = []

var Params = function() {
    this.curves = true;
    this.circles = true;
    this.amount = 10;
    this.lineWidth = 10;
    this.taper = 'parabolic';
    this.strokes = false;
    this.sizeAttenuation = false;
    this.animateWidth = false;
    this.spread = false;
    this.autoRotate = true;
    this.autoUpdate = true;
    this.animateVisibility=false;
    this.update = function() {
        clearLines();
        createLines();
    }
};

params = new Params();

//总控制台
window.addEventListener( 'load', function() {

    //初始化echart与three场景
    init();
    animate();

    /*
  * 生成标记点和曲线
  * */
/*
    generateAllPathsPoints(radius)   //主要作用飞线路径的生成
    getCurvePoints()     //飞线路径上点的控制
    createLines()
    for (var i = 0; i < trail_path_count; i++) {
        setFlightTimes(i,10);
    }
*/

    function update() {
        if( params.autoUpdate ) {
            clearLines();
            createLines();
        }
    }


} );

function init() {
    initMaptalk();
    initMap();
    initThree();

    window.addEventListener( 'resize', onWindowResize, false );
    // container.addEventListener( 'mousemove', onMouseMove, false );

}
//初始化echart场景
function initMap() {

    mapCanvas = document.createElement( 'canvas' );
    mapCanvas.width = mapSize.width;
    mapCanvas.height = mapSize.height;

    mapTexture = new THREE.Texture( mapCanvas );

    var chart = echarts.init ( mapCanvas );

    option = {
        visualMap: {
            show: false,
            min: 0,
            max: 1000000,
            text:[ 'High', 'Low' ],
            realtime: false,
            calculable: true,
            inRange: {
                color: [ 'lightskyblue', 'yellow', 'orangered' ]
            }
        },

        backgroundColor: '#000000',
        geo: [{
            type: 'map',
            map: 'world',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            boundingCoords: [[-180, 90], [180, -90]],
            silent: true,
            itemStyle: {
                normal: {
                    areaColor: '#000000',
                    borderColor: '#9ac0eb',
                    borderWidth: 1
                }
            }
        },
            {
                type: 'map',
                map: 'china',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                boundingCoords: [[-180, 90], [180, -90]],
                silent: true,
                itemStyle: {
                    normal: {
                        areaColor: '#0a142b',
                        borderColor: '#9ac0eb',
                        borderWidth:5
                    }
                }
            },
            {
                type: 'map',
                map: 'china',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                boundingCoords: [[-180, 90], [180, -90]],
                silent: true,
                itemStyle: {
                    normal: {
                        areaColor: '#000000',
                        borderColor: '#9ac0eb',
                        borderWidth:1
                    }
                }
            }]

    };

    chart.setOption( option );
    mapTexture.needsUpdate = true;

    // 选中或移出时才更新贴图
    // 内存向显存上传数据很慢，应该尽量减少贴图更新
    chart.on( 'mouseover', function () {
        mapTexture.needsUpdate = true;
    } );

    chart.on( 'mouseout', function () {
        mapTexture.needsUpdate = true;
    } );


}


//初始化three场景
function initThree() {


    //A maptalks Layer to render with THREE.js
    var threeLayer = new maptalks.ThreeLayer('t');
    threeLayer.prepareToDraw = function (gl, scene, camera) {
        /*  var light = new THREE.PointLight(0xffffff, 0.8);
          camera.add(light);
          var me = this;
          countries.features.forEach(function (g) {
              var num = g.properties.population;
              var color = getColor(num);

              var m = new THREE.MeshPhongMaterial({color: color, opacity : 0.7});

              var mesh = me.toExtrudeGeometry(maptalks.GeoJSON.toGeometry(g), num / 4E2, m);
              if (Array.isArray(mesh)) {
                  scene.add.apply(scene, mesh);
              } else {
                  scene.add(mesh);
              }
          });*/
    };

    map2.addLayer(threeLayer);

    /*
    航班，机场，路线数据结构模拟
    {
         airlineFields:["name", "country"] 航空领域
         airportsFields:["name", "city", "country", "longitude", "latitude"]   机场领域
         airlines:[["Air France", "France"], ["easyJet", "United Kingdom"], ["Southwest Airlines", "United States"],…] 航班
         airports:[["Goroka", "Goroka", "Papua New Guinea", 145.391881, -6.081689],…]   机场
         routes:[[9, 4242, 3777], [9, 4242, 3653], [9, 3619, 3571], [9, 3911, 3571], [9, 3911, 3385], [9, 3911, 3731],…]  路线
     }

     */

     container = document.getElementById('container');
    // 场景
    scene = new THREE.Scene();
    // 相机
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.z = -38;
    // 渲染器
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    //SCENE
    scene = new THREE.Scene();
    //包裹
    all_mesh = new THREE.Object3D()
    /* all_mesh.rotation.x = 0.6
     all_mesh.rotation.y = -1.9
     all_mesh.rotation.z = -0.1*/
    all_mesh.rotateX(-Math.PI / 5);
    all_mesh.rotateY(-Math.PI / 7);
    all_mesh.rotateZ(Math.PI / 17);
    all_mesh.scale.set(2, 2, 2);
    scene.add(all_mesh)

    // Lights
    // var light = new THREE.AmbientLight(0xffffff);
    //scene.add(light );

    directionalLight = new THREE.DirectionalLight(0x0f1722, 10);
    scene.add(directionalLight);

    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 1.0;  //按住鼠标左键后拖动查看时的旋转速度
    controls.zoomSpeed = 1.2;   //用滚轮调整大小(远近)时候的速度
    controls.panSpeed = 0.8;    //按住鼠标右键后的平移速度
    controls.noZoom = false;    //如果设置为true, 则禁用 鼠标滚轮调整大小(远近)的功能
    controls.noPan = false;     //如设置为true, 则禁用 按下鼠标右键平移的功能
    //controls.minDistance = 200;   //设置滚轮能滚到的最近距离
    //controls.maxDistance = 1000;   //设置滚轮能滚到的最远距离
    controls.staticMoving = true;   //试了一下, 如果设置为false, 则移动速度贼鸡儿快,嗖的一下就不见了, 具体是干啥玩意的没摸清


    //纹理加载
    var textureLoader = new THREE.TextureLoader();
    var colorMap = textureLoader.load("./assets/img/earth/land_mask_LH_all2.png");
    var bumpMap = textureLoader.load("./assets/img/earth/bump.jpg");
    var specMap = textureLoader.load("./assets/img/earth/earthspec.jpg");
    stroke = textureLoader.load("./assets/img/earth/stroke.png");

    texture = {
        colorMap: colorMap,
        //bumpMap: bumpMap,
        stroke: stroke
        // specMap: specMap
    }

    // 地球
    var earth_geo = new THREE.SphereGeometry(radius, segments, segments);

    var earth_mat = new THREE.MeshLambertMaterial({
        //color: 0xff0000,
        // opacity: 0.9,
        // transparent: true,
        //combine: THREE.MixOperation,
        // combine: THREE.MultiplyOperation,选择环境贴图和表面颜色的组合方式可选
        // reflectivity: 0.1,
        map: mapTexture
    });
    //earth_mat.map = colorMap
    earth_mat.specularMap = specMap
    earth_mat.bumpMap = bumpMap
    earth_mat.bumpScale = 0.1
    //earth_mat.specular = new THREE.Color('#2e2e2e');
    earth_mat.needsUpdate = true;

    earth_mesh = new THREE.Mesh(earth_geo, earth_mat)
    //earth_mesh.rotateY( - Math.PI /2.1 );
    all_mesh.add(earth_mesh);

    //three构造map元素
   // var defaultCity = ["ZYHB","ZYTX","ZYCC","ZBHH","ZBSJ","ZBYN","ZSJN","ZSOF","ZSCN","ZLXN","ZSFZ","ZLLL","ZJSY","ZULS","ZLIC","ZGNN","ZUGY"]


   /*    var colors = [
        0xed6a5a,
        0xf4f1bb,
        0x9bc1bc,
        0x5ca4a9,
        0xe6ebe0,
        0xf0b67f,
        0xfe5f55,
        0xd6d1b1,
        0xc7efcf,
        0xeef5db,
        0x50514f,
        0xf25f5c,
        0xffe066,
        0x247ba0,
        0x70c1b3
    ];
    //three线构造

     var TAU = 2 * Math.PI;
     var hexagonGeometry = new THREE.Geometry();
     for( var j = 0; j < TAU - .1; j += TAU / 100 ) {
         var v = new THREE.Vector3();
         v.set( Math.cos( j ), Math.sin( j ), 0 );
         hexagonGeometry.vertices.push( v );
     }
     hexagonGeometry.vertices.push( hexagonGeometry.vertices[ 0 ].clone() );


    //createLines();
    function createLines() {
            for (var j = 0; j < params.amount; j++) {
                createLine();
            }
        }

    function createLine() {
            if (params.circles) makeLine(hexagonGeometry);
            if( params.curves ) makeLine( createCurve() );
            makeLine( makeVerticalLine() );
            makeLine( makeSquare() );
        }

    function makeLine(geo) {

            var g = new THREE.MeshLine();
            switch (params.taper) {
                case 'none':
                    g.setGeometry(geo);
                    break;
                case 'linear':
                    g.setGeometry(geo, function (p) {
                        return 1 - p;
                    });
                    break;
                case 'parabolic':
                    g.setGeometry(geo, function (p) {
                        return 1 * Maf.parabola(p, 1)
                    });
                    break;
                case 'wavy':
                    g.setGeometry(geo, function (p) {
                        return 2 + Math.sin(50 * p)
                    });
                    break;
            }

            var material = new THREE.MeshLineMaterial({
                map: strokeTexture,
                useMap: params.strokes,
                color: new THREE.Color(colors[Maf.randomInRange(0, colors.length)]),
                opacity: 1,//params.strokes ? .5 : 1,
                dashArray: new THREE.Vector2(10, 5),
                resolution: resolution,
                sizeAttenuation: params.sizeAttenuation,
                lineWidth: params.lineWidth,
                near: camera.near,
                far: camera.far,
                depthWrite: false,
                depthTest: !params.strokes,
                alphaTest: params.strokes ? .5 : 0,
                transparent: true,
                side: THREE.DoubleSide
            });
            var mesh = new THREE.Mesh(g.geometry, material);
            if (params.spread || params.circles) {
                var r = 50;
                mesh.position.set(Maf.randomInRange(-r, r), Maf.randomInRange(-r, r), Maf.randomInRange(-r, r));
                var s = 10 + 10 * Math.random();
                mesh.scale.set(s, s, s);
                mesh.rotation.set(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI);
            }
            all_mesh.add(mesh);

            lines.push(mesh);

        }

    function createCurve() {

        var s = new THREE.ConstantSpline();
        var rMin = 5;
        var rMax = 10;
        var origin = new THREE.Vector3( Maf.randomInRange( -rMin, rMin ), Maf.randomInRange( -rMin, rMin ), Maf.randomInRange( -rMin, rMin ) );

        s.inc = .001;
        s.p0 = new THREE.Vector3( .5 - Math.random(), .5 - Math.random(), .5 - Math.random() );
        s.p0.set( 0, 0, 0 );
        s.p1 = s.p0.clone().add( new THREE.Vector3( .5 - Math.random(), .5 - Math.random(), .5 - Math.random() ) );
        s.p2 = s.p1.clone().add( new THREE.Vector3( .5 - Math.random(), .5 - Math.random(), .5 - Math.random() ) );
        s.p3 = s.p2.clone().add( new THREE.Vector3( .5 - Math.random(), .5 - Math.random(), .5 - Math.random() ) );
        s.p0.multiplyScalar( rMin + Math.random() * rMax );
        s.p1.multiplyScalar( rMin + Math.random() * rMax );
        s.p2.multiplyScalar( rMin + Math.random() * rMax );
        s.p3.multiplyScalar( rMin + Math.random() * rMax );

        s.calculate();
        var geometry = new THREE.Geometry();
        s.calculateDistances();
        //s.reticulate( { distancePerStep: .1 });
        s.reticulate( { steps: 500 } );
        var geometry = new THREE.Geometry();

        for( var j = 0; j < s.lPoints.length - 1; j++ ) {
            geometry.vertices.push( s.lPoints[ j ].clone() );
        }

        return geometry;

    }

    function makeVerticalLine() {
        var g = new THREE.Geometry()
        var x = ( .5 - Math.random() ) * 100;
        g.vertices.push( new THREE.Vector3( x, -10, 0 ) );
        g.vertices.push( new THREE.Vector3( x, 10, 0 ) );
        return g;
    }

    function makeSquare() {
        var g = new THREE.Geometry()
        var x = ( .5 - Math.random() ) * 100;
        g.vertices.push( new THREE.Vector3( -1, -1, 0 ) );
        g.vertices.push( new THREE.Vector3( 1, -1, 0 ) );
        g.vertices.push( new THREE.Vector3( 1, 1, 0 ) );
        g.vertices.push( new THREE.Vector3( -1, 1, 0 ) );
        g.vertices.push( new THREE.Vector3( -1, -1, 0 ) );
        return g;
    }*/

    /*    var geometry = new THREE.SphereGeometry(radius, segments, segments);
                    var material = new THREE.MeshBasicMaterial({
                        color: 0x333333,
                        wireframe: true,
                        transparent: true
                    });
                    var sphere = new THREE.Mesh(geometry, material);
                    all_mesh.add(sphere);*/
    //Draw the GeoJSON
    /* $.getJSON("./assets/data/china.json", function(data) {
            drawThreeGeo(data, 10, 'sphere', {
                color: 0x003366
            },all_mesh );
        });
    */
    /*   $.getJSON("./assets/data/test_geojson/countries_states.geojson", function(data) {
            drawThreeGeo(data, radius, 'sphere', {
                color: 0x003366
            }, all_mesh);
        });*/
    /*    $.getJSON("./assets/data/test_geojson/china-ext.json", function(data) {
            drawThreeGeo(data, radius, 'sphere', {
                color: 0x003366
            }, all_mesh);
        });

        $.getJSON("./assets/data/test_geojson/coastline-fixed.json", function(data) {
            drawThreeGeo(data, radius, 'sphere', {
                color: 0x003366
            }, all_mesh);
        });*/
    /*    // clouds

        var materialClouds = new THREE.MeshLambertMaterial( {

            map: textureLoader.load( "./assets/img/earth/earth_clouds_1024.png" ),
            transparent: true

        } );

        meshClouds = new THREE.Mesh(earth_geo, materialClouds );
        meshClouds.scale.set( cloudsScale, cloudsScale, cloudsScale );
        meshClouds.rotation.z = tilt;
        all_mesh.add( meshClouds );

        // moon

        var materialMoon = new THREE.MeshPhongMaterial( {

            map: textureLoader.load( "./assets/img/earth/moon_1024.jpg" )

        } );

        meshMoon = new THREE.Mesh(earth_geo, materialMoon );
        meshMoon.position.set( radius * 4, 0, 0 );
        meshMoon.scale.set( moonScale, moonScale, moonScale );
        all_mesh.add( meshMoon );

        // stars

        var i, r = radius, starsGeometry = [ new THREE.Geometry(), new THREE.Geometry() ];

        for ( i = 0; i < 250; i ++ ) {

            var vertex = new THREE.Vector3();
            vertex.x = Math.random() * 2 - 1;
            vertex.y = Math.random() * 2 - 1;
            vertex.z = Math.random() * 2 - 1;
            vertex.multiplyScalar( r );

            starsGeometry[ 0 ].vertices.push( vertex );

        }

        for ( i = 0; i < 1500; i ++ ) {

            var vertex = new THREE.Vector3();
            vertex.x = Math.random() * 2 - 1;
            vertex.y = Math.random() * 2 - 1;
            vertex.z = Math.random() * 2 - 1;
            vertex.multiplyScalar( r );

            starsGeometry[ 1 ].vertices.push( vertex );

        }

        var stars;
        var starsMaterials = [
            new THREE.PointsMaterial( { color: 0x555555, size: 2, sizeAttenuation: false } ),
            new THREE.PointsMaterial( { color: 0x555555, size: 1, sizeAttenuation: false } ),
            new THREE.PointsMaterial( { color: 0x333333, size: 2, sizeAttenuation: false } ),
            new THREE.PointsMaterial( { color: 0x3a3a3a, size: 1, sizeAttenuation: false } ),
            new THREE.PointsMaterial( { color: 0x1a1a1a, size: 2, sizeAttenuation: false } ),
            new THREE.PointsMaterial( { color: 0x1a1a1a, size: 1, sizeAttenuation: false } )
        ];

        for ( i = 10; i < 30; i ++ ) {

            stars = new THREE.Points( starsGeometry[ i % 2 ], starsMaterials[ i % 6 ] );

            stars.rotation.x = Math.random() * 6;
            stars.rotation.y = Math.random() * 6;
            stars.rotation.z = Math.random() * 6;
            stars.scale.setScalar( i * 10 );

            stars.matrixAutoUpdate = false;
            stars.updateMatrix();

            all_mesh.add( stars );

        }*/

    }

//初始化maptalk场景
function initMaptalk(){
//Original Example of Echarts 3
//http://echarts.baidu.com/demo.html#geo-lines

    mapCanvas = document.createElement( 'canvas' );
    mapCanvas.width = mapSize.width;
    mapCanvas.height = mapSize.height;

    mapTexture = new THREE.Texture( mapCanvas );

    map2 = new maptalks.Map(container,{
        center:[106.27, 38.47,0],
        zoom:4.0,
        minZoom:1,
        maxZoom:5,
        zoomInCenter:true,
        layers:[
            new maptalks.VectorLayer('v')
        ]
    })

    map = new maptalks.Map(mapCanvas,{
        center:[109.08052,36.04231,0],
        zoom:4.8,
        minZoom:1,
        maxZoom:5,
        zoomInCenter:true,
        layers:[
            new maptalks.VectorLayer('v')
        ]
    })

// map.setPitch(28.800000000000026)

    loadVector(map, "./assets/data/coastline-fixed.json", {
        name: "coastline",
        layerOptions:{
            zIndex:101
        },
        symbol: {
            'lineWidth': 1,
            'lineColor': 'rgba(57,130,222,1)',
        }
    });

    loadVector(map, "./assets/data/ne_110m_ocean.json", {
        name: "ocean",
        layerOptions:{
            zIndex:100
        },
        symbol: {
            'lineWidth': 0,
            'polygonFill': 'rgb(17,24,32)'

        }
    });

    loadVector(map, "./assets/data/china-ext.json", {
        name: "china-ext",
        layerOptions:{
            zIndex:104
        },
        symbol: {
            'lineWidth': 3,
            'lineColor': 'rgb(57,130,222)',
            'shadowBlur': 8,
            'shadowOffsetX': -5,
            'shadowOffsetY': 5
        }
    });

    loadVector(map, "./assets/data/china.json", {
        name: "china",
        layerOptions:{
            zIndex:103
        },
        symbol: {
            'lineWidth': 1,
            'lineColor': 'rgba(57,130,222,0.4)',
            'polygonFill':'rgba(8,25,41,0.8)'

        }
    });

    function loadVector(map, url, options) {
        $.getJSON(url, function (json) {
            var features = json.features;
            var vectors = [];
            features.forEach(function (f) {

                var geometry = {
                    feature: f,
                    symbol: options.symbol
                }


                var feature = maptalks.Geometry.fromJSON(geometry);

                vectors.push(feature);
            });

            new maptalks.VectorLayer(options.name, vectors,options.layerOptions).addTo(map);
        });
    }

    $.ajaxSetup({
        async : false
    });

    e3Layer = new maptalks.E3Layer('e3', {
        tooltip: {
            trigger: 'item'
        },
        series: getECOption()
    }).addTo(map2);
    mapTexture.needsUpdate = true;

    /*setInterval(function(){
        var series = getECOption()
        e3Layer.setEChartsOption({
            tooltip: {
                trigger: 'item'
            },
            series: series
        })
    },60000)*/


}

function getECOption() {
    var geoCoordMap = {};
    $.get('http://'+DATASERVER+ROUTES.airport,function(res){
        var data = JSON.parse(res).data;
        for(var i in data){
            if(data[i].apName.toUpperCase() != 'ALL'){
                geoCoordMap[data[i].airportName+""] = [data[i].lng,data[i].lat]
                if(data[i].airportLevel == 2 || data[i].airportLevel == 3 ||  defaultCity.indexOf(data[i].apName) != -1){
                    airports.push({name:data[i].airportName,apName:data[i].apName})
                }
            }
        }
    })

    var series = [];
    var convertData = function (data) {
        var res = [];
        for (var i = 0; i < data.length; i++) {
            var dataItem = data[i];
            var fromCoord = geoCoordMap[dataItem[0].name];
            var toCoord = geoCoordMap[dataItem[1].name];
            if (fromCoord && toCoord) {
                res.push({
                    fromName: dataItem[0].name,
                    toName: dataItem[1].name,
                    coords: [fromCoord, toCoord]
                });
            }
        }
        return res;
    };

    request(ROUTES.aircompany,{},function(res){
        var data = JSON.parse(res).airportPairSchFlightCount;
        var tmpData = [];
        Object.keys(data).map((key)=>{
            if(key.charAt(0).toUpperCase() == 'Z' && key.charAt(5).toUpperCase() == 'Z'){
                tmpData.push({
                    cities:key.split('-'),
                    value:0
                })
            }

        })
        tmpData = tmpData.slice(0,30)
        var tmp = []
        var seriesData = []
        for(var i in tmpData){
            var startCity = ''
            var endCity = ''
            var value = 0
            $.get('http://'+DATASERVER+ROUTES.airport+'?apName='+tmpData[i].cities[0],function(res){
                var data = JSON.parse(res).data[0]
                if(data){
                    startCity = data.airportName;
                }

            })
            $.get('http://'+DATASERVER+ROUTES.airport+'?apName='+tmpData[i].cities[1],function(res){
                var data = JSON.parse(res).data[0]
                if(data){
                    endCity = data.airportName;
                }
            })

            $.get('http://'+DATASERVER+ROUTES.airportdynamic+'?apName='+tmpData[i].cities[0],function(res){

                var data = JSON.parse(res).data[0]
                try{
                    var tmp = JSON.parse(data.countStasticsResult)

                }catch(e){
                    var fs = require('fs')
                    var date = new Date();
                    var path = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()
                    fs.writeFileSync(__dirname+'/logs/map/'+path+'.txt','时间：'+date.getTime()+'  城市：'+tmpData[i].cities[0]+'--------------data: '+res+'------------'+JSON.stringify(e)+'\r\n',{flag:'a'})
                }
                value = parseFloat(tmp.scheduleOnTimeRate).toFixed(3)

            })
            var num = i*1+1;
            if(startCity&&endCity){
                tmp.push([{'name':startCity},{name:endCity,value:value}])
            }
            if(num%6==0){
                seriesData.push(tmp)
                tmp =[];
            }
        }
        var seriesDatas = []
        for(var i in seriesData){
            seriesDatas.push([i,seriesData[i]])
        }
        var color = ['orange', 'yellow', 'darkblue','lightblue','green'];

        seriesDatas.forEach(
            function (item, i) {
                series.push({
                        name: item[0] + ' Top10',
                        type: 'lines',
                        zlevel: 1,
                        effect: {
                            show: true,
                            period: 6,
                            trailLength: 0.7,
                            color: '#fff',
                            symbolSize: 3
                        },
                        lineStyle: {
                            normal: {
                                color: color[i],
                                width: 0,
                                curveness: 0.2
                            }
                        },
                        data: convertData(item[1])
                    },
                    {
                        name: item[0] + ' Top10',
                        type: 'lines',
                        zlevel: 2,
                        effect: {
                            show: false
                        },
                        lineStyle: {
                            normal: {
                                color: color[i],
                                width: 2,
                                opacity: 0.4,
                                curveness: 0.2
                            }
                        },
                        data: convertData(item[1])
                    },

                    {
                        name: item[0] + ' Top10',
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        zlevel: 2,
                        rippleEffect: {
                            brushType: 'stroke'
                        },
                        label: {
                            normal: {
                                show: true,
                                position: 'right',
                                formatter: '{b}'
                            }
                        },
                        symbolSize: function (val) {
                            return val[2] / 8;
                        },
                        itemStyle: {
                            normal: {
                                color: color[i]
                            }
                        },
                        data: item[1].map(function (dataItem) {
                            return {
                                // name: dataItem[1].name,
                                value: geoCoordMap[dataItem[1].name].concat([dataItem[1].value])
                            };
                        })
                    });
            });

    },true)

    // 加两千万级以上的机场
    var airports_rate = []
    for(var i in airports){
        $.get('http://'+DATASERVER+ROUTES.airportdynamic+'?apName='+airports[i].apName,function(res){
            var data = JSON.parse(res).data[0]
            var tmp = JSON.parse(data.countStasticsResult)
            var value = parseFloat(tmp.scheduleOnTimeRate).toFixed(3)
            airports_rate.push(value)
        })
    }
    series.push({
        name: '点',
        type: 'scatter',
        coordinateSystem: 'geo',
        symbol: 'pin',

        label: {
            normal: {
                show: true,
                textStyle: {
                    color: '#fff',
                    fontSize: 14,
                }
            }
        },
        itemStyle: {
            normal: {
                color: function (e) {
                    var rate = e.data[2];
                    if(rate<25){
                        return "#de0303";

                    }else if(rate<50){
                        return "#ffc300";
                    }else if(rate<75){
                        return "#b0cf21";
                    }

                    return "#12efa9";
                }
            }
        },
        zlevel: 6,
        symbolSize: 35,
        data: airports.map(function (dataItem,i) {
            if(dataItem.name == '上海/浦东'){
                geoCoordMap['上海/浦东'][0] = '121.9925'
            }
            if(dataItem.name == '上海/虹桥'){
                geoCoordMap['上海/虹桥'][0] = '121.13611111111111'
            }
            return geoCoordMap[dataItem.name].concat([(airports_rate[i]*100).toFixed(0)]);
        })

    })
    return series
}

function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
        resolution.set(window.innerWidth, window.innerHeight);

    }

function onMouseMove(event) {

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);       // 通过鼠标坐标和相机位置构造射线

        var intersected = raycaster.intersectObject(earth_mesh);   // 获取射线和地球的相交点

        if (intersected && intersected.length > 0) {


            var x = intersected[0].uv.x * mapSize.width;
            var y = mapSize.height - intersected[0].uv.y * mapSize.height;

            var virtualEvent = document.createEvent('MouseEvents');
            virtualEvent.initMouseEvent('mousemove', false, true, document.defaultView, 1, x, y, x, y, false, false, false, false, 0, null);
            mapCanvas.dispatchEvent(virtualEvent);

        }

    }

    /*
     * 生成曲线的控制点
     * @param float radius
     * @param start array
     * @param end array
     * */
function generateOnePathPoints(radius, start, end) {

        var start_lng = start[0];
        var start_lat = start[1];

        var end_lng = end[0];
        var end_lat = end[1];

        var max_height = Math.random() * lineHeight;   //每条线路高度随机

        var points = [];  //根据经纬度转换后的三维点数组

        var spline_control_points = 8;    //样条点的控制数

        for (var i = 0; i < spline_control_points + 1; i++) {

            var arc_angle = i * 180.0 / spline_control_points;  //每条线路圆弧的弧度

            var arc_radius = radius + (Math.sin(arc_angle * Math.PI / 180.0)) * max_height;  //每条线路圆弧的半径

            var latlng = latlngInterPoint(start_lat, start_lng, end_lat, end_lng, i / spline_control_points);  //获取到二维经纬坐标点，待研究

            var pos = xyzFromLatLng(latlng.lat, latlng.lng, arc_radius);  //经纬度点转化三维坐标点

            points.push(new THREE.Vector3(pos.x, pos.y, pos.z));

        }

        var spline = new THREE.CatmullRomCurve3(points);   //实际传入三个关键点vector3数组元素，上中下

        spline_curves.push(spline);  //飞线路径数组


        var arc_length = spline.getLength();

        trail_flight_distance.push(arc_length);   //飞线圆弧长度


    }

    /*
    * @param string radius
    * */
function generateAllPathsPoints(radius) {   //所有线路

        //国内航班
        PATH_DATA2.forEach(function (line) {
            generateOnePathPoints(radius, line.start, line.end)    //每一条线路
        })

        //国际航班
        // PATH_DATA由数据经纬度开始结束位置构成一组线数组lines

        /*
            PATH_DATA.forEach(function (line) {
                generateOnePathPoints(radius, line.start, line.end)    //每一条线路
            })
        */


        trail_path_count = spline_curves.length   //飞线路径数目赋值

    }

function xyzFromLatLng(lat, lng, radius) {
        var phi = (90 - lat) * Math.PI / 180;
        var theta = (360 - lng) * Math.PI / 180;

        return {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.cos(phi),
            z: radius * Math.sin(phi) * Math.sin(theta)
        };
    }

function latlngInterPoint(lat1, lng1, lat2, lng2, offset) {
        lat1 = lat1 * Math.PI / 180.0;
        lng1 = lng1 * Math.PI / 180.0;
        lat2 = lat2 * Math.PI / 180.0;
        lng2 = lng2 * Math.PI / 180.0;

        const d = 2 * Math.asin(Math.sqrt(Math.pow((Math.sin((lat1 - lat2) / 2)), 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
        const A = Math.sin((1 - offset) * d) / Math.sin(d);
        const B = Math.sin(offset * d) / Math.sin(d);
        const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
        const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
        const z = A * Math.sin(lat1) + B * Math.sin(lat2);
        const lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180 / Math.PI;
        const lng = Math.atan2(y, x) * 180 / Math.PI;

        return {
            lat: lat,
            lng: lng
        };
    }

function createLines() {

        var strokeMap = texture.stroke;

        for (var i = 0; i < trail_path_count; i++) {

            var ml = new THREE.MeshLine();
            ml.setGeometry(trail_points[i], function (p) {
                return p
            });

            var material = new THREE.MeshLineMaterial({
                useMap: true,
                map: stroke,
                color: new THREE.Color(colorArray[1]),
                opacity: 0.9,
                resolution: resolution,
                sizeAttenuation: false,
                lineWidth: lineWidth / 2,
                near: camera.near,
                far: camera.far,
                depthTest: true,
                transparent: true
            });

            var trail = new THREE.Mesh(ml.geometry, material);
            ml_arr.push(ml)
            all_mesh.add(trail);
        }
    }

function flyShape() {

        // 飞机形状
        var planeShape = new THREE.Shape();
        planeShape.moveTo(0, 0);
        planeShape.lineTo(0.2, -0.2);
        planeShape.lineTo(0.2, -1.3);
        planeShape.lineTo(1.6, -2.7);
        planeShape.lineTo(1.6, -3);
        planeShape.lineTo(0.2, -2.1);
        planeShape.lineTo(0.2, -3);
        planeShape.lineTo(0.5, -3.4);
        planeShape.lineTo(0.5, -3.7);
        planeShape.lineTo(0, -3.3);
        planeShape.lineTo(-0.5, -3.7);
        planeShape.lineTo(-0.5, -3.4);
        planeShape.lineTo(-0.2, -3);
        planeShape.lineTo(-0.2, -2.1);
        planeShape.lineTo(-1.6, -3);
        planeShape.lineTo(-1.6, -2.7);
        planeShape.lineTo(-0.2, -1.3);
        planeShape.lineTo(-0.2, -0.2);
        var planeGeometry = new THREE.ShapeGeometry(planeShape);
        // 飞机材质
        var planeMaterial = new THREE.MeshPhongMaterial({color: 0x0FB4DD, side: THREE.DoubleSide, depthTest: true});

        // 添加飞机
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        /*    // 旋转
        plane.rotation.z = THREE.Math.degToRad(item.ang);
        // 定位
        var position = getPosition(item.lng, item.lat, 5);
        plane.position.set(position.x, position.y, position.z);*/
        // 显示/隐藏
        // plane.visible = false;
        // 保存
        // planeMarkers[item.anum] = plane;
        // 添加到场景
        all_mesh.add(plane);
        // 绘制历史轨迹

    }

function getCurvePoints() {

        for (var i = 0; i < trail_path_count; i++) {

            var vertices = spline_curves[i].getPoints(trail_path_points_num)  //每条飞线按初始值100个点平分
            var points = new Float32Array(trail_points_num * 3)
            for (var j = 0; j < trail_points_num; j++) {
                // 起始阶段全部放置在初始位置
                points[j * 3 + 0] = vertices[0].x;
                points[j * 3 + 1] = vertices[0].y;
                points[j * 3 + 2] = vertices[0].z;
            }

            trail_paths.push(vertices)
            trail_points.push(points)
        }

    }

function setFlightTimes(i, interval) {
        interval = interval ? interval : 0;
        var duration = trail_flight_distance[i] * 800
        var start_time = Date.now() + Math.random() * 150 + i * 100 + interval
        flight_start_time[i] = start_time;
        flight_end_time[i] = start_time + duration;
    }

// 线性缓动计算
function easeLinear(t, d) {
        return t / d
    }

function update_flights() {

        //移动轨迹的飞线
        timer += clock.getDelta();

        var final_ease_val = (trail_path_points_num + trail_points_num) / trail_path_points_num

        for (var i = 0; i < trail_path_count; ++i) {
            if (Date.now() > flight_start_time[i]) {
                var ease_val = easeLinear(Date.now() - flight_start_time[i], flight_end_time[i] - flight_start_time[i])
                if (ease_val >= final_ease_val) {
                    setFlightTimes(i, 8000)
                    ease_val = 0
                }

                var pointIndex = ~~(trail_path_points_num * ease_val)
                if (pointIndex > trail_path_points_num) {
                    var delta = trail_path_points_num + trail_points_num - pointIndex;
                    for (var j = 0; j < trail_points_num; j++) {

                        if (j < delta) {

                            var k = trail_path_points_num - 1 - (delta - j);
                            trail_points[i][j * 3 + 0] = trail_paths[i][k].x
                            trail_points[i][j * 3 + 1] = trail_paths[i][k].y
                            trail_points[i][j * 3 + 2] = trail_paths[i][k].z
                        } else {
                            var k = trail_path_points_num - 1;
                            trail_points[i][j * 3 + 0] = trail_paths[i][k].x
                            trail_points[i][j * 3 + 1] = trail_paths[i][k].y
                            trail_points[i][j * 3 + 2] = trail_paths[i][k].z
                        }
                    }
                } else {
                    var delta = pointIndex - trail_points_num
                    for (var j = 0; j < trail_points_num; j++) {
                        var k = (j + delta >= 0) ? (j + delta) : 0
                        trail_points[i][j * 3 + 0] = trail_paths[i][k].x
                        trail_points[i][j * 3 + 1] = trail_paths[i][k].y
                        trail_points[i][j * 3 + 2] = trail_paths[i][k].z
                    }
                }

                ml_arr[i].setGeometry(trail_points[i], function (p) {
                    return p
                });
            }
        }

    }

function animate() {
        requestAnimationFrame(animate);
        render();
    }

function render() {
        camera.lookAt(scene.position);
       // update_flights();
       //定时获取航线数据
    var series = getECOption()
 /*   e3Layer.setEChartsOption({
        tooltip: {
            trigger: 'item'
        },
        series: series
    })*/
        controls.update();
        directionalLight.position.copy(camera.position);

        renderer.render(scene, camera);
    }


