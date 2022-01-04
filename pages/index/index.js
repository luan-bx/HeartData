// // index.js
// import { promisifyAll, promisify } from 'wx-promise-pro'
// // promisify all wx‘s api
// promisifyAll()
// // promisify single api
// promisify(wx.getSystemInfo)().then(console.log)
/*
  用户的注册、登陆
*/

// 获取应用实例
const app = getApp()
// 引入图表插件
var wxCharts = require('../../utils/wxcharts.js');
var lineChart = null;
var flag = false;
var cnt = 2;
var qwe = [];


Page({
  data: {
    // 用户信息
    userInfo: {},
    // 画图
    x_value: [],
    x_data:[],
    y_data:[],
    heartdata: [],  
    aaa: '',
    timer:'',
    qwe:[],
    // 蓝牙
    showBluetoothDevices: false,
    bleLists: null,
    deviceId: '',
    name: '',
    serviceId: '',
    services: [],
    heartdataServiceUUID: '',
    heartdataCharacteristicsUUID: "0000FFF1-0000-1000-8000-00805F9B34FB",
    result: null,
    buffer:[],
    interval: "" //定时器
  },

  // 页面初始化加载
  onLoad: function () {
    var that = this;
    var arr1 = new Array(250);
    for (var i = 0; i < 250; i++) {
      arr1[i] = i + 1;
      
    }
    that.setData({
      userInfo: app.globalData.userInfo,
      x_value: arr1,
    });
     this.OnWxChart(that.data.x_value, that.data.heartdata, '心电信号');
   
    // timer(1), 每1ms执行一次time();

    // console.log(this.data.userInfo);
    /**
     * 1.初始化蓝牙模块
     * 其他蓝牙相关 API 必须在 wx.openBluetoothAdapter 调用之后使用。否则 API 会返回错误（errCode=10000）
     * 如果设备已经打开蓝牙会报错：openBluetoothAdapter:fail already opened，但是不影响逻辑进success
     */
    wx.openBluetoothAdapter({
      mode: "central",
      success: function (res) {
        console.log('蓝牙适配器初始化成功 central', res.errMsg);
      },
      fail: function (res) {
        console.log('蓝牙适配器初始化异常 central', res.errMsg);
      }
    });
    wx.openBluetoothAdapter({
      mode: "peripheral",
      success: function (res) {
        console.log('蓝牙适配器初始化成功 peripheral', res.errMsg);
      },
      fail: function (res) {
        console.log('蓝牙适配器初始化异常 peripheral', res.errMsg);
      }
    });
    /**
     * 2. 获取本机蓝牙适配器状态
     */
    wx.getBluetoothAdapterState({
      success: function (res) {
        console.log('获取本机蓝牙适配器状态', res.errMsg);
        wx.showToast({
          title: "蓝牙已开启",
          duration: 2000
        });
      },
      fail: function (res) {
        console.log('获取本机蓝牙适配器状态', res.errMsg);
        wx.showToast({
          title: "蓝牙状态异常",
          duration: 2000
        });
      }
    });
    /**
     *  3. 监听蓝牙适配器状态变化事件
     */
    wx.onBluetoothAdapterStateChange(function (res) {
      console.log(`adapterState changed, now is`, res)
    });
  },

  //测试文件传输服务
  testTransport: function () {
    // var data = new Array(); 
    // data = this.heartdata;
    // for(var i = 0; i < 250 - 1; i++){
    //   data[i] = data[i + 1];
    // }
    // data[250 - 1] = cnt;
    // this.setData({
    //   heartdata: data
    // });
    // 向服务器发送数据
    wx.request({
      url: app.globalData.domain + '/saveData',
      header: {
        'Connection': 'keep-alive'
      },
      data: {
        onedata: cnt,
        // pepoleid: app.globalData.pepoleid,
        filepath: app.globalData.filepath
      },
      success(res) {
        if (res.data == '500') {
          // 关闭蓝牙连接
          // ....
          // 提示错误
          wx.showToast({
            title: '数据传输服务器失败',
            icon: 'fail',
            duration: 2000
          });
        } else {
          // 存储当前服务器文件路径
          app.globalData.filepath = res.data;
        }
      }
    });
    // test
    if (cnt > 5) {
      flag = true;
    } else if (cnt < 1) {
      flag = false
    }
    if (flag) {
      cnt--;
    } else {
      cnt++;
    }
  },

  // 运行
  action: function () {
    // 监听蓝牙和数据传输
    var that = this;
    this.ble();
    // // 绘图
    //this.OnWxChart(this.data.x_data, this.data.heartdata, '心电信号');
     
    // var that = this;
    // var eee = wx.getStorageSync('heartdata') 
    
    // setInterval(function() {
        
    //           //  that.OnWxChart(that.data.x_data, eee, '心电信号');
    //       }, 100)
    // setTimeout(function () {
    //   var interval = setInterval(function () {
    //    that.send();
    //   },100)
    //   that.setData({
    //     interval:interval
    //  })
    // }, 10000);
    //this.send(); 
    setTimeout(function () {
      that.send();
    }, 8000)
  },

  ble: function () {
    // 弹出蓝牙列表
    this.setData({
      // 20211012 修改，暂不弹出，跳转页面。
      showBluetoothDevices: false
    });
    /**
     * 4. 开始搜寻附近的蓝牙外围设备
     */
    wx.startBluetoothDevicesDiscovery({
      success: function (res) {
        console.log('开始搜寻附近的蓝牙外围设备', res);
      },
      fail: function (res) {
        console.log('搜寻附近的蓝牙外围设备失败', res);
      }
    });
    wx.showToast({
      title: "搜索中...",
      duration: 1500
    });
    var that = this;
    setTimeout(function () {
      /**
       * 5. 获取在蓝牙模块生效期间所有搜索到的蓝牙设备。
       * 这里不用that会报错 why???
       */
      wx.getBluetoothDevices({
        success: function (res) {
          console.log('获取所有已发现的蓝牙设备', res);
          var lists = new Array();
          var index = 0;
          for (var i = 0; i < res.devices.length; i++) {
            if (!res.devices[i].name.startsWith("未知或不支持的设备")) {
              lists[index++] = res.devices[i];
            }
          }
          that.setData({
            bleLists: lists
          });
          // 20211012 add
          app.globalData.bleLists = that.data.bleLists;
          // console.log(app.globalData.bleLists);
        },
      })
    }, 2000);
    // 20211012 add ble page.
    setTimeout(function () {
      wx.navigateTo({
        url: '/pages/ble/ble'
      });
    }, 2000)
  },

  // 连接蓝牙
  connectBle: function () {
    /**
     * 6. 停止搜寻附近的蓝牙外围设备
     * 这个后面在关闭小程序时调用
     */
    wx.stopBluetoothDevicesDiscovery({
      success(res) {
        console.log('停止搜寻附近的蓝牙外围设备', res);
      }
    })
    var that = this;
    that.setData({
      // deviceId: e.currentTarget.dataset.id,
      // 20211012 修改
      deviceId: app.globalData.selectedBleId
    });
    console.log('选中的设备deviceId', this.data.deviceId);
    /**
     * 7.监听蓝牙低功耗连接状态的改变事件。包括开发者主动连接或断开连接，设备丢失，连接异常断开等等
     */
    wx.onBLEConnectionStateChange(function (res) {
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
    });
    /** 
     * 8.连接蓝牙低功耗设备。若小程序在之前已有搜索过某个蓝牙设备，并成功建立连接，可直接传入之前搜索获取的 deviceId 直接尝试连接该设备，无需再次进行搜索操作。
     */
    wx.createBLEConnection({
      deviceId: that.data.deviceId,
      success: function (res) {
        console.log('连接蓝牙低功耗设备成功', res);
        /**
         * 9.连接成功后开始获取设备的服务列表(service)。
         */
        wx.getBLEDeviceServices({
          deviceId: that.data.deviceId,
          success: function (res) {
            // 回调结果中读取服务列表
            console.log('获取设备的服务uuid列表', res.services);
            that.setData({
              services: res.services
            });
            /* 
              选定一个服务UUID
              20211019 需要对service uuid列表遍历，找到特定char uuid "00002a37-0000-1000-8000-00805f9b34fb"
            */
            // that.setData({
            //   serviceId: that.data.services[0].uuid
            // });
            // console.log('选中的服务uuid', that.data.services[1].uuid);
            /**
             * 设定一个定时器。在定时到期以后执行注册的回调函数
             * 延迟3秒，根据服务获取特征 
             */
            setTimeout(
              function () {
                // 20211019 添加循环，遍历service uuid列表
                for (var i = 0; i < res.services.length; i++) {
                  console.log(i);
                  // that.setData({
                  //   heartdataServiceUUID: res.services[i].uuid,
                  // });
                  /**
                   * 10.获取蓝牙低功耗设备某个服务中所有特征 (characteristic)。
                   */
                  wx.getBLEDeviceCharacteristics({
                    deviceId: that.data.deviceId,
                    // serviceId: that.data.serviceId,
                    // 20211019 替换为遍历过程中的serviceId
                    serviceId: res.services[i].uuid,
                    success: function (res) {
                      /** 
                       * 获取设备特征列表
                       * 属性	       类型	   说明
                       * uuid	      string	蓝牙设备特征的 UUID
                       * properties	Object	该特征支持的操作类型
                       */
                      console.log('获取当前服务uuid的特征uuid列表', res);
                      for (var j = 0; j < res.characteristics.length; j++) {
                        if (res.characteristics[j].uuid == that.data.heartdataCharacteristicsUUID) {
                          console.log("获取到heartdataCharacteristicsuuid", res.characteristics[j].uuid);
                          that.setData({
                            heartdataServiceUUID: that.data.services[1].uuid
                          });
                          console.log("对应的heartdataServiceuuid", that.data.services[1].uuid);
                          // 写入开机指令
                          that.enableBLEData("1919");
                          /**
                           * 11. 启用蓝牙低功耗设备特征值变化时的 notify 功能，订阅特征。注意：必须设备的特征支持 notify 或者 indicate 才可以成功调用。
                           * 顺序开发设备特征notifiy
                           */
                          wx.notifyBLECharacteristicValueChange({
                            // 启用 notify 功能
                            // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
                            deviceId: that.data.deviceId,
                            serviceId: that.data.heartdataServiceUUID,
                            characteristicId: that.data.heartdataCharacteristicsUUID,
                            state: true,
                            success: function (res) {
                              console.log('启用蓝牙低功耗设备特征值变化时的 notify 功能', res)
                            }
                          });
                          /**
                           * 12. 监听蓝牙低功耗设备的特征值变化事件。必须先调用 wx.notifyBLECharacteristicValueChange 接口才能接收到设备推送的 notification。
                           * 回调获取 设备发过来的数据
                           */
                          wx.onBLECharacteristicValueChange(function (characteristic) {
       //                     console.log('监听蓝牙低功耗设备的特征值变化事件', characteristic)
                            /**
                             * 监听heartdataCharacteristicsUUID中的结果
                             */
                            if (characteristic.characteristicId == that.data.heartdataCharacteristicsUUID) {
                              //  读取返回的数据
                              const result = characteristic.value;
                              // console.log(result);
                              const hex = that.buf2hex(result);

                              that.setData({
                                result: hex
                              });

                             // that.data.aaa += hex
                             
                             // wx.setStorageSync('heartdata', that.data.aaa)
                          




                              
                              // that.data.aaa.push(hex);
                             // console.log(that.data.aaa)
                              var buf = hex;
                              var lengthBuf = buf.length;
                              while (lengthBuf >= 16) {
                                if (buf[0] == 1 && buf[1] == 1 && buf[14] == 0 && buf[15] == 1) {
                                  var str1 = buf.substring(2, 8);
                                  var str2 = buf.substring(8, 14);
                                  var value1 = parseInt(str1, 16);
                                  var value2 = parseInt(str2, 16);
                                  if (value1 >= 8388608) {
                                    value1 = value1 - 16777216;
                                  }
                                  value1 = value1 * 2.24 * 1000 / 8388608;
                                  if (value2 >= 8388608) {
                                    value2 = value2 - 16777216;
                                  }
                                  value2 = value2 * 2.24 * 1000 / 8388608;

                               // var yyy = value1 - value2;
                                //that.data.aaa.push(yyy);
                                //console.log('aaa', that.data.aaa)


                                  // that.data.heartdata=value1 - value2;
                                  var y_data = that.data.heartdata;
                                  
                                  for (var i = 0; i < 249; i++) {
                                    y_data[i] = y_data[i + 1];
                                  }
                                  y_data[249] = value1 - value2;
                                  wx.setStorageSync('heartdata', y_data)
            //                       // console.log(that.data.heartdata);
            //                      // isFull() etc..

            //   //y_data已经是500的数组，所以直接储存value1 - value2的结果，异步保存不限长度数组，在外面调用函数，
            //   //进行y_data的移位更新 循环y_data[i] = y_data[i + 1]

                           
                        

            //                       // 向服务器发送数据
            //                       wx.request({
            //                         url: app.globalData.domain + '/saveData',
            //                         header: {
            //                           'Connection': 'keep-alive'
            //                         },
            //                         data: {
            //                           onedata: yyy,
            //                           // pepoleid: app.globalData.pepoleid,
            //                           filepath: app.globalData.filepath
            //                         },
            //                         success(res) {
            //                           if (res.data == '500') {
            //                             // 关闭蓝牙连接
            //                             // ....
            //                             // 提示错误
            //                             wx.showToast({
            //                               title: '数据传输服务器失败',
            //                               icon: 'fail',
            //                               duration: 2000
            //                             });
            //                           } else {
            //                             // 存储当前服务器文件路径
            //                             app.globalData.filepath = res.data;
            //                           }
            //                         },
            //                         fail(res){
            // //                          console.log("连接服务器失败", res);
            //                         }
            //                       });

            //                       // that.setData({
            //                       //   userInfo: app.globalData.userInfo,
            //                       //   heartdata: y_data,
            //                       // });

            //                       // that.OnWxChart(that.data.x_data, that.data.heartdata, '心电信号');
                                  buf = buf.substring(16, buf.length);
                                  lengthBuf = buf.length;
                                } else {
                                  buf = buf.substring(1, buf.length);
                                  lengthBuf = buf.length;
                                }
                              }
                              // var eee = wx.getStorageSync('heartdata')
                              // that.OnWxChart(that.data.x_data, eee, '心电信号');
                            }            
                        });
                          break;
                        }
                      }
                    }
                  });
                }
              },0);
          }
        })
      },
      fail: function (res) {
        console.log('连接蓝牙低功耗设备失败', res.errMsg);
        wx.showToast({
          title: "连接失败",
          duration: 2000
        });
      }
    });
    // 开启定时任务 timer(1);
    /*
    if(!this.data.flag){
      timer(1);
      this.data.flag = true;
    }
    */
    // 隐藏蓝牙列表
    this.setData({
      showBluetoothDevices: false
    });
    
  },

  send: function() {
   var that = this;
  //   var buf = wx.getStorageSync('heartdata')
  //   var lengthBuf = buf.length;
    // var interval = setInterval(function () {

      // var asd = 2;

      // this.setData({                    //每隔10s刷新一次
      //   timer: setInterval(function () {
      //     var qwe = wx.getStorageSync('heartdata')
      //    that.OnWxChart(that.data.x_value, qwe);
      // }, 100)
      // })
      // var qwe = wx.getStorageSync('heartdata');
      // var asd = qwe.length;
     
        
      
      setInterval(function () {
 //for (let i = 0; i < asd; i++) {
         var qwe = wx.getStorageSync('heartdata')
         //console.log(1111)
         that.OnWxChart(that.data.x_value, qwe);

      //}
  }, 100)

  //      setInterval(function () {
  //        var qwe = wx.getStorageSync('heartdata')
  //       that.OnWxChart(that.data.x_value, qwe);
  //      }
  //      ,100)
  // var context = wx.createCanvasContext('heart')
  // context.OnWxChart()


  //  that.setData({
  //     interval:interval
  //  })




  //  while (lengthBuf >= 16) {
  //     if (buf[0] == 1 && buf[1] == 1 && buf[14] == 0 && buf[15] == 1) {
  //       var str1 = buf.substring(2, 8);
  //       var str2 = buf.substring(8, 14);
  //       var value1 = parseInt(str1, 16);
  //       var value2 = parseInt(str2, 16);
  //       if (value1 >= 8388608) {
  //         value1 = value1 - 16777216;
  //       }
  //       value1 = value1 * 2.24 * 1000 / 8388608;
  //       if (value2 >= 8388608) {
  //         value2 = value2 - 16777216;
  //       }
  //       value2 = value2 * 2.24 * 1000 / 8388608;

  //       var y_value = that.data.heartdata;
  //       // var y_data = that.data.heartdata;
  //       for (var i = 0; i < 249; i++) {
  //         y_value[i] = y_value[i + 1];
  //       }
  //       y_value[249] = value1 - value2;

  //       that.setData({
  //         userInfo: app.globalData.userInfo,
  //         heartdata: y_value,
  //       });

  //               //  that.setData({
                                   
  //               //                     heartdata: y_data,
  //               //                   });
  //               //var that = this;


  //               // console.log(that.data.x_value)
  //               // console.log(that.data.heartdata)


  //     //           setTimeout(function () {


  //       console.log(222)

  //       //var yvaluelength =y_value.length
  //     //if(yvaluelength>500){
  //    that.OnWxChart(that.data.x_value, that.data.heartdata, '心电信号');
    
  //       // console.log(111)
  //       // }


  //     //  }, 100)
  //     //        setInterval(function () {
  //     //         that.OnWxChart(that.data.x_value, that.data.heartdata, '心电信号');
  //     //         console.log(111)
  //     // },100)
    

  //       buf = buf.substring(16, buf.length);
  //       lengthBuf = buf.length;
  //     } else {
  //       buf = buf.substring(1, buf.length);
  //       lengthBuf = buf.length;
  //     }
  //   }, 4) 
  //   that.setData({
  //     interval:interval
  //  })
   // }                 
    //  setTimeout(function () {

    //   while (lengthBuf >= 16) {
    //     that.OnWxChart(that.data.x_value, that.data.heartdata, '心电信号');
    //     console.log(111)
       
    //   }
    // }, 1000)
      //        setInterval(function () {
      //         that.OnWxChart(that.data.x_value, that.data.heartdata, '心电信号');
      //         console.log(111)
      // },100)


//   },100)
//   that.setData({
//     interval:interval
//  })
    // var eee = wx.getStorageSync('heartdata')
    //setInterval(function() {
     
          //}, 1000)

//     var abc = new Array(500);
//  for (let i = 0; i < eee.length; i++) {
//   this.removeFront() 
//   this.addBack()
//   }
// if(eee.length===500){
//        // var idx = 0;
//         //var jobList = eee;
//        // this.arrRemoveObj(jobList, jobList[idx]);
//        var abc = new Array(500);
//        for (let i = 0; i < eee.length; i++) {
//        abc[i] = eee[i+1]
      
//       } if(i=500){
//           abc[i] = abc[i+1]
//        }
// }


// setTimeout(function () {
//                                    var y_value = new Array(500);
//                                   // var aaalength = that.data.aaa.length+10000

//                                  // var y_value = that.data.aaa;
//                                   var aaalength = that.data.aaa.length+1000
                                  
//                             //for(var j = 0; j < 500; j++){
//                               var i = 0;
//                               while (aaalength >= i) {   
//                                    for (var j = 0; j < 499; j++) {
//                                            y_value[j] = y_value[j + 1];   
//                                       };
//                                         y_value[499] = that.data.aaa[i]   
//                                         i++;                          
//                             console.log('y_value[499]',y_value[499]);    
//                           }
//  that.OnWxChart(that.data.x_data, y_value, '心电信号');  
//                         }, 10000);
},


//  arrRemoveObj: function (array, obj)  {
//   let length = array.length;
//   for (let i = 0; i < length; i++) {
//       if (array[i] === obj) {
//           if (i === 0) {
//               array.shift();
//               return array;
//           } else if (i === length - 1) {
//               array.pop();
//               return array;
//           } else {
//               array.splice(i, 1);
//               return array;
//           }
//       }
//   }
// },



//    Deque: {
//   construcor () {
//     // 存储数据
//     this.items = {}
//     // 队列头部元素索引
//     this.lowestCount = 0
//     // 队列尾部元素索引
//     this.count = 0
//   },

//   enqueue (elemenet) {
//     this.items[this.count] = element
//     this.count++
//   },

//   removeFront () {
//     if (this.isFull()) {
      
//     }
//     let result = this.items[this.lowestCount]
//     delete this.items[this.lowestCount]
//     this.lowestCount++
//     return result
//   },
  
//   addBack (element) {
//     this.items[this.count] = element
//     this.count++
//   },
 
//   isFull () {
//     abc.length === 500
//   },

//   size () {
//     return this.count - this.lowestCount
//   },

//   clear () {
//     this.items = {}
//     this.count = 0
//     this.lowestCount = 0
//   },
// },







//   sendCode: function(e) {
//     var that = this;
//     var eee = wx.getStorageSync('heartdata')
//     var interval = setInterval(function() {
        
         
//          that.OnWxChart(that.data.x_data, eee, '心电信号');
     
//     }, 1000)
//     that.setData({
//       interval: interval
//     })
// },


  // func timeer
  // timer(int ms){

  //}
  /**
   * 发送 数据到设备中
   */
  enableBLEData: function (data) {
    var that = this;
    var hex = data
    var typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }))
    console.log("转换为Uint8Array", typedArray);
    var buffer1 = typedArray.buffer
    console.log("对应的buffer值，typedArray.buffer", buffer1)
    /**
     * 向蓝牙低功耗设备特征值中写入二进制数据。
     */
    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.heartdataServiceUUID,
      characteristicId: that.data.heartdataCharacteristicsUUID,
      value: buffer1,
      success: function (res) {
        console.log("success  指令发送成功");
      },
      fail: function (res) {
        console.log("success  指令发送失败", res.errMsg);
      }
    });
  },

  /**
   * 数据转hex
   */
  buf2hex: function (buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  },

  // 取消连接蓝牙
  cancelConnectBle: function () {
    this.setData({
      showBluetoothDevices: false
    });
  },
  //折线图绘制方法  
  OnWxChart: function (x_data, y_data, name) {
  // var y_data = []

    var windowWidth = '',
      windowHeight = ''; //定义宽高
    try {
      var res = wx.getSystemInfoSync(); //试图获取屏幕宽高数据
      windowWidth = res.windowWidth / 750 * 690; //以设计图750为主进行比例算换
      windowHeight = res.windowWidth / 750 * 550 //以设计图750为主进行比例算换
    } catch (e) {
      console.error('getSystemInfoSync failed!'); //如果获取失败
    }
    lineChart = new wxCharts({
      canvasId: 'heart', //输入wxml中canvas的id
      type: 'line',
      categories: x_data, //模拟的x轴横坐标参数
      animation: false, //是否开启动画

      series: [{
        name: name,
        data: y_data,
        format: function (val, name) {
          return val;
        }
      }],
      xAxis: { //是否隐藏x轴分割线
        disableGrid: true,
      },
      yAxis: { //y轴数据
        title: '电压(V)', //标题
        format: function (val) { //返回数值
          return val.toFixed(2);
        },
        min: 0, //最小值
        max: 10, // 最大值
        gridColor: '#D8D8D8',
      },
      width: windowWidth * 1.1, //图表展示内容宽度
      height: windowHeight, //图表展示内容高度
      dataLabel: false, //是否在图表上直接显示数据
      dataPointShape: false, //是否在图标上显示数据点标志
      extra: {
        lineStyle: 'Broken' //曲线
      },
    });
  },

  /**
   * 13.小程序切后台或销毁时
   * 20211012 暂时不用，需要跳转ble页面
   */
  // onHide: function (res) {
  //   wx.closeBluetoothAdapter({
  //     success: function (res) {
  //       console.log("小程序切后台或销毁", res);
  //     }
  //   })
  // },

  /**
   * 14. 重新初始化蓝牙
   */
  onShow: function (res) {
    console.log("app.globalData.selectedBleId: ", app.globalData.selectedBleId);
    if (app.globalData.selectedBleId != "") {
      this.connectBle();
    }
    // /**
    //  * 1.初始化蓝牙模块
    //  * 其他蓝牙相关 API 必须在 wx.openBluetoothAdapter 调用之后使用。否则 API 会返回错误（errCode=10000）
    //  * 如果设备已经打开蓝牙会报错：openBluetoothAdapter:fail already opened，但是不影响逻辑进success
    //  */
    // wx.openBluetoothAdapter({
    //   success: function (res) {
    //     console.log('蓝牙适配器初始化成功', res.errMsg);
    //   },
    //   fail: function (res) {
    //     console.log('蓝牙适配器初始化异常', res.errMsg);
    //   }
    // });
    // /**
    //  * 2. 获取本机蓝牙适配器状态
    //  */
    // wx.getBluetoothAdapterState({
    //   success: function (res) {
    //     console.log('获取本机蓝牙适配器状态', res.errMsg);
    //     wx.showToast({
    //       title: "蓝牙已开启",
    //       duration: 2000
    //     });
    //   },
    //   fail: function (res) {
    //     console.log('获取本机蓝牙适配器状态', res.errMsg);
    //     wx.showToast({
    //       title: "蓝牙状态异常",
    //       duration: 2000
    //     });
    //   }
    // });
    // /**
    //  *  3. 监听蓝牙适配器状态变化事件
    //  */
    // wx.onBluetoothAdapterStateChange(function (res) {
    //   console.log(`adapterState changed, now is`, res)
    // });
  }
})