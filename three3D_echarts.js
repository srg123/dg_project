
var container, stats;
var camera, scene, renderer;
var group;
var mouseX = 0, mouseY = 0;

var controls;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var directionalLight;

var earth;

var mapSize = {
    width: 4096,
    height: 2048
};
var mapCanvas, mapTexture;


init();
//animate();

// 初始化echarts3D地图

function initMap() {

   /* mapCanvas = document.createElement( 'canvas' );
    mapCanvas.width = mapSize.width;
    mapCanvas.height = mapSize.height;*/
   // mapTexture = new THREE.Texture( mapCanvas );
   //var chart = echarts.init ( mapCanvas , {renderer: "THREE"});


    var chart = echarts.init(document.getElementById('main'));

    var canvas = document.createElement('canvas');
    var mapChart = echarts.init(canvas, null, {
        width: 4096,
        height: 2048
    });



    mapChart.setOption({
        series : [

            {
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
                        areaColor: '#0a142b',
                        borderColor: '#9ac0eb',
                        borderWidth:1
                    }
                }
            }
        ]
    });

    $.getJSON(__dirname + '/assets/data/flights.json', function (data) {

        //data 字段
        // 航空领域airlineFields，
        // 航空线airlines，
        // 机场airports，
        // 机场领域airportsFields，
        // routes路线

        //机场坐标构造
       var airports = data.airports.map(function (item) {
            return {
                coord: [item[3], item[4]]
            }
        });

       //获取航线坐标功能
         function getAirportCoord(idx) {
             return [data.airports[idx][3], data.airports[idx][4]];
         }

          //机场路线遍历
         // Route: [airlineIndex, sourceAirportIndex, destinationAirportIndex]
         var routesGroupByAirline = {};

         data.routes.forEach(function (route) {

             var airline = data.airlines[route[0]];
             var airlineName = airline[0];
             if (!routesGroupByAirline[airlineName]) {
                 routesGroupByAirline[airlineName] = [];
             }
             routesGroupByAirline[airlineName].push(route);
         });

          //根据机场路线数据构造点坐标
           var pointsData = [];
          data.routes.forEach(function (airline) {

                   pointsData.push(getAirportCoord(airline[1]));
                   pointsData.push(getAirportCoord(airline[2]));
               });
         //遍历实际航线，构造渲染样式echarts
           var series = data.airlines.map(function (airline) {
                        var airlineName = airline[0];
                        var routes = routesGroupByAirline[airlineName];

                        if (!routes) {
                            return null;
                        }
                        return {
                            type: 'lines3D',
                            name: airlineName,

                            effect: {
                                show: true,
                                trailWidth: 2,
                                trailLength: 0.2,
                                trailOpacity: 0.4,
                                trailColor: 'rgb(30, 30, 60)'
                            },

                            lineStyle: {
                                width: 1,
                                color: 'rgb(50, 50, 150)',
                                // color: 'rgb(118, 233, 241)',
                                opacity: 0.1
                            },
                            blendMode: 'lighter',

                            distanceToGlobe: 4,

                            data: routes.map(function (item) {
                                return [airports[item[1]].coord, airports[item[2]].coord];
                            })
                        };
                    }).filter(function (series) {
                return !!series;
            });


        series.push({
            type: 'scatter3D',
            coordinateSystem: 'globe',
            blendMode: 'lighter',
            symbolSize: 2,
            distanceToGlobe: 4,
            itemStyle: {
                color: 'rgb(50, 50, 150)',
                opacity: 0.2
            },
            data: pointsData
        });

        chart.setOption({
       /*     toolbox: {
                feature: {
                    saveAsImage: {}
                },
                iconStyle: {
                    normal: {
                        borderColor: '#fff'
                    }
                }
            },
            legend: {
                selectedMode: 'single',
                left: 'left',
                data: Object.keys(routesGroupByAirline),
                orient: 'vertical',
                textStyle: {
                    color: '#fff'
                }
            },*/
            globe: {

                baseTexture: './assets/img/earth/world.topo.bathy.200401.jpg',
                environment: './assets/img/earth/starfield.jpg',
                heightTexture: './assets/img/earth/bathymetry_bw_composite_4k.jpg',

                displacementScale: 0.05,
                displacementQuality: 'high',

                baseColor: '#000',

                shading: 'realistic',
                realisticMaterial: {
                    roughness: 0.2,
                    metalness: 0
                },

                postEffect: {
                    enable: true,
                    depthOfField: {
                        enable: true
                    }
                },
                temporalSuperSampling: {
                    enable: true
                },
                light: {
                    ambient: {
                        intensity: 0
                    },
                    main: {
                        intensity: 0.1,
                        shadow: false
                    },
                    ambientCubemap: {
                        texture: './assets/img/earth/lake.hdr',
                        exposure: 1,
                        diffuseIntensity: 0.5,
                        specularIntensity: 2
                    }
                },
                viewControl: {
                    autoRotate: false
                },

                silent: true
                // layers: [{
                //     type: 'blend',
                //     blendTo: 'emission',
                //     texture: mapChart,
                //     intensity: 10
                // }]
            },
            series: series
        });


    });


/*    option = {
        visualMap: {
            show: false,
            min: 0,
            max: 1000000,
          /!*  text:[ 'High', 'Low' ],*!/
            realtime: true,     //拖拽时，是否实时更新。
            calculable: true, //是否显示拖拽用的手柄
            inRange: {
                color: [ 'lightskyblue', 'blue','#ffc74b' ]
            }
        },
        backgroundColor: '#999',
        series: [
            {
                type: 'map',
                mapType: 'myworld',
                roam: true,   //是否开启鼠标缩放和平移漫游。默认不开启。
                aspectScale: 1,  //这个参数用于 scale 地图的长宽比
                layoutCenter: [ '50%', '50%' ],
                layoutSize: 4096,
                boundingCoords: [[-180, 90], [180, -90]], //二维数组，定义定位的左上角以及右下角分别所对应的经纬度
                itemStyle:{
                    emphasis:{ label: { show: true } },
                    normal: {
                        areaColor: '#0a142b',
                        borderColor: '#9ac0eb',
                        borderWidth: 1
                    }
                },
                data: population    // from population.js
            },
            {
                type: 'map',
                map: 'mychina2',
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
                        borderWidth:1
                    }
                }
            }
      /!*      {
                type: 'map',
                map: 'myworld',
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
                        borderWidth:1
                    }
                }
            },*!/

        ]
    };

    if (option && typeof option === "object") {
        chart.setOption( option );
    }*/

  //  mapTexture.needsUpdate = true;

    // 选中或移出时才更新贴图
    // 内存向显存上传数据很慢，应该尽量减少贴图更新
 /*   chart.on( 'mouseover', function () {
        mapTexture.needsUpdate = true;
    } );

    chart.on( 'mouseout', function () {
        mapTexture.needsUpdate = true;
    } );*/



}
// 初始化three.js场景
function initScene() {

    container = document.getElementById( 'container' );
    stats = new Stats();
    container.appendChild( stats.dom );


    // 场景
    /*  var background = new THREE.CubeTextureLoader()
          .setPath( __dirname + '/assets/libs/three/textures/cube/MilkyWay/' )
          .load( [ 'dark-s_px.jpg', 'dark-s_nx.jpg', 'dark-s_py.jpg', 'dark-s_ny.jpg', 'dark-s_pz.jpg', 'dark-s_nz.jpg' ] );
      background.format = THREE.RGBFormat;*/

    scene = new THREE.Scene();
    //scene.background = background;


    // 相机
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10000 );
    /* camera.position.z = -400;*/
    camera.position.x = 200;
    //camera.position.y = 400;
    camera.position.z = 400;


    // 渲染器
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0x333333 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( renderer.domElement );

    // 控制器
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    /*  controls.rotateSpeed = 0.001;
      controls.autoRotate = true;*/


    /* cameraControls.target.set( 0, -400, 0 );
     cameraControls.maxDistance = 400;
     cameraControls.minDistance = 10;
     cameraControls.update();
     cameraControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
     cameraControls.dampingFactor = 0.25;

     cameraControls.panningMode = THREE.HorizontalPanning; // default is THREE.ScreenSpacePanning

     cameraControls.minDistance = 100;
     cameraControls.maxDistance = 500

     cameraControls.maxPolarAngle = Math.PI / 2;*/


    // 平行光
    directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
    //scene.add( directionalLight );

    // 环境光
    var light = new THREE.AmbientLight( 0xffffff );
    scene.add( light );

    // 地球
    var earthGeometry = new THREE.SphereBufferGeometry( 200, 36, 36 );
    var earthMaterial = new THREE.MeshLambertMaterial( { map: mapTexture, color: 0xffffff } );
    earth = new THREE.Mesh( earthGeometry, earthMaterial );

    /*   var loader = new THREE.TextureLoader();
       loader.load( './assets/img/land_mask_LH_all.png', function ( texture ) {

           var geometry = new THREE.SphereGeometry( 200, 20, 20 );

           var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );
           var mesh = new THREE.Mesh( geometry, material );
           group.add( mesh );

       } );*/

    scene.add( earth );

}

//模拟初始化echart数据
function initMap2() {

    mapCanvas = document.createElement( 'canvas' );
    mapCanvas.width = mapSize.width;
    mapCanvas.height = mapSize.height;

  //  var dom = document.getElementById("container");

  /*  var chart = echarts.init ( mapCanvas ,{
        renderer: "THREE"
    });*/


    var chart = echarts.init(mapCanvas);
  //  mapCanvas= dom.getElementsByTagName('canvas')[2];
    mapTexture = new THREE.Texture( mapCanvas );

    var app = {};
    option = null;
    var geoCoordMap = {
        '上海': [121.4648,31.2891],
        '东莞': [113.8953,22.901],
        '东营': [118.7073,37.5513],
        '中山': [113.4229,22.478],
        '临汾': [111.4783,36.1615],
        '临沂': [118.3118,35.2936],
        '丹东': [124.541,40.4242],
        '丽水': [119.5642,28.1854],
        '乌鲁木齐': [87.9236,43.5883],
        '佛山': [112.8955,23.1097],
        '保定': [115.0488,39.0948],
        '兰州': [103.5901,36.3043],
        '包头': [110.3467,41.4899],
        '北京': [116.4551,40.2539],
        '北海': [109.314,21.6211],
        '南京': [118.8062,31.9208],
        '南宁': [108.479,23.1152],
        '南昌': [116.0046,28.6633],
        '南通': [121.1023,32.1625],
        '厦门': [118.1689,24.6478],
        '台州': [121.1353,28.6688],
        '合肥': [117.29,32.0581],
        '呼和浩特': [111.4124,40.4901],
        '咸阳': [108.4131,34.8706],
        '哈尔滨': [127.9688,45.368],
        '唐山': [118.4766,39.6826],
        '嘉兴': [120.9155,30.6354],
        '大同': [113.7854,39.8035],
        '大连': [122.2229,39.4409],
        '天津': [117.4219,39.4189],
        '太原': [112.3352,37.9413],
        '威海': [121.9482,37.1393],
        '宁波': [121.5967,29.6466],
        '宝鸡': [107.1826,34.3433],
        '宿迁': [118.5535,33.7775],
        '常州': [119.4543,31.5582],
        '广州': [113.5107,23.2196],
        '廊坊': [116.521,39.0509],
        '延安': [109.1052,36.4252],
        '张家口': [115.1477,40.8527],
        '徐州': [117.5208,34.3268],
        '德州': [116.6858,37.2107],
        '惠州': [114.6204,23.1647],
        '成都': [103.9526,30.7617],
        '扬州': [119.4653,32.8162],
        '承德': [117.5757,41.4075],
        '拉萨': [91.1865,30.1465],
        '无锡': [120.3442,31.5527],
        '日照': [119.2786,35.5023],
        '昆明': [102.9199,25.4663],
        '杭州': [119.5313,29.8773],
        '枣庄': [117.323,34.8926],
        '柳州': [109.3799,24.9774],
        '株洲': [113.5327,27.0319],
        '武汉': [114.3896,30.6628],
        '汕头': [117.1692,23.3405],
        '江门': [112.6318,22.1484],
        '沈阳': [123.1238,42.1216],
        '沧州': [116.8286,38.2104],
        '河源': [114.917,23.9722],
        '泉州': [118.3228,25.1147],
        '泰安': [117.0264,36.0516],
        '泰州': [120.0586,32.5525],
        '济南': [117.1582,36.8701],
        '济宁': [116.8286,35.3375],
        '海口': [110.3893,19.8516],
        '淄博': [118.0371,36.6064],
        '淮安': [118.927,33.4039],
        '深圳': [114.5435,22.5439],
        '清远': [112.9175,24.3292],
        '温州': [120.498,27.8119],
        '渭南': [109.7864,35.0299],
        '湖州': [119.8608,30.7782],
        '湘潭': [112.5439,27.7075],
        '滨州': [117.8174,37.4963],
        '潍坊': [119.0918,36.524],
        '烟台': [120.7397,37.5128],
        '玉溪': [101.9312,23.8898],
        '珠海': [113.7305,22.1155],
        '盐城': [120.2234,33.5577],
        '盘锦': [121.9482,41.0449],
        '石家庄': [114.4995,38.1006],
        '福州': [119.4543,25.9222],
        '秦皇岛': [119.2126,40.0232],
        '绍兴': [120.564,29.7565],
        '聊城': [115.9167,36.4032],
        '肇庆': [112.1265,23.5822],
        '舟山': [122.2559,30.2234],
        '苏州': [120.6519,31.3989],
        '莱芜': [117.6526,36.2714],
        '菏泽': [115.6201,35.2057],
        '营口': [122.4316,40.4297],
        '葫芦岛': [120.1575,40.578],
        '衡水': [115.8838,37.7161],
        '衢州': [118.6853,28.8666],
        '西宁': [101.4038,36.8207],
        '西安': [109.1162,34.2004],
        '贵阳': [106.6992,26.7682],
        '连云港': [119.1248,34.552],
        '邢台': [114.8071,37.2821],
        '邯郸': [114.4775,36.535],
        '郑州': [113.4668,34.6234],
        '鄂尔多斯': [108.9734,39.2487],
        '重庆': [107.7539,30.1904],
        '金华': [120.0037,29.1028],
        '铜川': [109.0393,35.1947],
        '银川': [106.3586,38.1775],
        '镇江': [119.4763,31.9702],
        '长春': [125.8154,44.2584],
        '长沙': [113.0823,28.2568],
        '长治': [112.8625,36.4746],
        '阳泉': [113.4778,38.0951],
        '青岛': [120.4651,36.3373],
        '韶关': [113.7964,24.7028]
    };

    var BJData = [
        [{name:'北京'}, {name:'上海',value:95}],
        [{name:'北京'}, {name:'广州',value:90}],
        [{name:'北京'}, {name:'大连',value:80}],
        [{name:'北京'}, {name:'南宁',value:70}],
        [{name:'北京'}, {name:'南昌',value:60}],
        [{name:'北京'}, {name:'拉萨',value:50}],
        [{name:'北京'}, {name:'长春',value:40}],
        [{name:'北京'}, {name:'包头',value:30}],
        [{name:'北京'}, {name:'重庆',value:20}],
        [{name:'北京'}, {name:'常州',value:10}]
    ];

    var SHData = [
        [{name:'上海'},{name:'包头',value:95}],
        [{name:'上海'},{name:'昆明',value:90}],
        [{name:'上海'},{name:'广州',value:80}],
        [{name:'上海'},{name:'郑州',value:70}],
        [{name:'上海'},{name:'长春',value:60}],
        [{name:'上海'},{name:'重庆',value:50}],
        [{name:'上海'},{name:'长沙',value:40}],
        [{name:'上海'},{name:'北京',value:30}],
        [{name:'上海'},{name:'丹东',value:20}],
        [{name:'上海'},{name:'大连',value:10}]
    ];

    var GZData = [
        [{name:'广州'},{name:'福州',value:95}],
        [{name:'广州'},{name:'太原',value:90}],
        [{name:'广州'},{name:'长春',value:80}],
        [{name:'广州'},{name:'重庆',value:70}],
        [{name:'广州'},{name:'西安',value:60}],
        [{name:'广州'},{name:'成都',value:50}],
        [{name:'广州'},{name:'常州',value:40}],
        [{name:'广州'},{name:'北京',value:30}],
        [{name:'广州'},{name:'北海',value:20}],
        [{name:'广州'},{name:'海口',value:10}]
    ];

    var planePath = 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z';

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

    var color = ['#a6c84c', '#ffa022', '#46bee9'];
    var series = [];
    [['北京', BJData], ['上海', SHData], ['广州', GZData]].forEach(function (item, i) {
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
                symbol: ['none', 'arrow'],
                symbolSize: 10,
                effect: {
                    show: true,
                    period: 6,
                    trailLength: 0,
                    symbol: planePath,
                    symbolSize: 15
                },
                lineStyle: {
                    normal: {
                        color: color[i],
                        width: 1,
                        opacity: 0.6,
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
                        name: dataItem[1].name,
                        value: geoCoordMap[dataItem[1].name].concat([dataItem[1].value])
                    };
                })
            });
    });

    option = {
        backgroundColor: '#999',
        title : {
            text: '模拟迁徙',
            subtext: '数据纯属虚构',
            left: 'center',
            textStyle : {
                color: '#fff'
            }
        },
        tooltip : {
            trigger: 'item'
        },
        legend: {
            orient: 'vertical',
            top: 'bottom',
            left: 'right',
            data:['北京 Top10', '上海 Top10', '广州 Top10'],
            textStyle: {
                color: '#fff'
            },
            selectedMode: 'single'
        },
        geo: {
            map: 'china',
            label: {
                emphasis: {
                    show: false
                }
            },
            roam: true,
            itemStyle: {
                normal: {
                    areaColor: '#323c48',
                    borderColor: '#404a59'
                },
                emphasis: {
                    areaColor: '#2a333d'
                }
            }
        },
        series: series
    };


    if (option && typeof option === "object") {
        chart.setOption(option, true);
    }
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
// 初始化maptalks
function initMapTalks(){

    var defaultCity = ["ZYHB","ZYTX","ZYCC","ZBHH","ZBSJ","ZBYN","ZSJN","ZSOF","ZSCN","ZLXN","ZSFZ","ZLLL","ZJSY","ZULS","ZLIC","ZGNN","ZUGY"]
    var map = new maptalks.Map( mapCanvas,{
        center:[109.08052,36.04231],
        zoom:4.8,
        minZoom:1,
        maxZoom:5,
        zoomInCenter:true,
        layers:[
            new maptalks.VectorLayer('v')
        ]
    })
    console.log(map);// map.setPitch(28.800000000000026)

    loadVector(map, __dirname + '/assets/data/coastline-fixed.json', {
        name: "coastline",
        layerOptions:{
            zIndex:101
        },
        symbol: {
            'lineWidth': 1,
            'lineColor': 'rgba(57,130,222,1)',
        }
    });

    loadVector(map, __dirname + '/assets/data/ne_110m_ocean.json', {
        name: "ocean",
        layerOptions:{
            zIndex:100
        },
        symbol: {
            'lineWidth': 0,
            'polygonFill': 'rgb(17,24,32)'

        }
    });

    loadVector(map, __dirname + '/assets/data/china-ext.json', {
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

    loadVector(map, __dirname + '/assets/data/china.json', {
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

    var airports = []

    var e3Layer = new maptalks.E3Layer('e3', {
        tooltip: {
            trigger: 'item'
        },
        series: getECOption()
    }).addTo(map);

    setInterval(function(){
        var series = getECOption()
        e3Layer.setEChartsOption({
            tooltip: {
                trigger: 'item'
            },
            series: series
        })
    },60000)

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


}

function init() {

    //首先加载数据
    $.ajaxSetup({
        async : false
    });

   /* $.get(__dirname + '/assets/data/china.json', function (data) {
        var json = JSON.parse(data)
        echarts.registerMap('mychina2', json);
    });*/

   /* $.get(__dirname + '/assets/data/world.json', function (data) {
    var json = JSON.parse(data)
    echarts.registerMap('myworld', json);
    });
*/
    //初始化echarts与three

    initMap();
   // initScene();

    //initMapTalks();


  //  window.addEventListener( 'resize', onWindowResize, false );

   // container.addEventListener( 'mousemove', onDocumentMouseMove, false );


}


function onWindowResize() {

    /* windowHalfX = window.innerWidth / 2;
     windowHalfY = window.innerHeight / 2;*/

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );



}

function onDocumentMouseMove( event ) {

    /*  mouseX = ( event.clientX - windowHalfX );
      mouseY = ( event.clientY - windowHalfY );*/

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );       // 通过鼠标坐标和相机位置构造射线

    var intersected = raycaster.intersectObject( earth );   // 获取射线和地球的相交点

    if ( intersected && intersected.length > 0 ) {

        // 根据射线相交点的uv反算出在canvas上的坐标
        var x = intersected[ 0 ].uv.x * mapSize.width;
        var y = mapSize.height - intersected[ 0 ].uv.y * mapSize.height;

        // 在mapCanvas上模拟鼠标事件，这里或许有更好的方法
        var virtualEvent = document.createEvent( 'MouseEvents' );
        virtualEvent.initMouseEvent( 'mousemove', false, true, document.defaultView, 1, x, y, x, y,false, false, false, false, 0, null );
        mapCanvas.dispatchEvent(virtualEvent);

    }

}

function animate() {

    requestAnimationFrame( animate )

    controls.update();

    render();
    // stats.update();
}

function render() {

     camera.lookAt( scene.position );

  /*  camera.lookAt({//相机看向哪个坐标
        x : 300,
        y : 300,
        z : 300
    });*/

    // camera.lookAt( scene.position );
    // 平行光始终从相机位置照向地球
    directionalLight.position.copy( camera.position );

    renderer.render( scene, camera );
    stats.update();

}
