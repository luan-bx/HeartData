// pages/monthReport/monthReport.js

// 获取应用实例
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    year: '',
    month: '',
    monthReports: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var y = options.year;
    var m = options.month;
    var that = this;
    // 通过http请求，加载当前的月报告
    wx.showToast({
      title: '月报告获取中...',
      icon: 'loading',
      duration: 3000
    });
    wx.request({
      url: app.globalData.domain + '/getMonthReport',
      data: {
        year: y,
        month: m,
        pepoleid: app.globalData.pepoleid
      },
      success(res) {
        if (res.data == 'error') {
          wx.showToast({
            title: '月报告获取失败',
            icon: 'fail',
            duration: 2000
          });
        } else if (res.data == '500') {
          wx.showToast({
            title: '请先登陆',
            icon: 'fail',
            duration: 2000
          });
          wx.navigateTo({
            url: '/pages/login/login',
          });
        }else {
          // console.log(res.data);
          that.setData({
            monthReports: res.data,
            year: y,
            month: m
          });
        }
      } 
    })
    // 解析JSON对象
    /*
    var res = '{ "data" : ['+
                '{ '+
                  '"year": "2020",'+
                  '"month": ['+
                    '{ "m": "1",' +
                      '"imgurl": "/static/imgs/reports/riqi1.png",'+
                      '"title": "1月报告",'+
                      '"description": "1月报告，良好",'+
                      '"analysis": {'+
                        '"HealthIndex": "8.0",'+
                        '"Other": ""'+
                      '},'+
                      '"dayLists":['+
                        '{ "d" : "1",'+
                          '"imgurl": "/static/imgs/reports/riqi1.png",'+
                          '"isUsed": "true",'+
                          '"HealthIndex" : "9.9"'+
                        '},'+
                        '{ "d" : "2",'+
                          '"imgurl": "/static/imgs/reports/riqi2.png",'+
                          '"used": "false",'+
                          '"HealthIndex" : ""'+
                        '},'+
                        '{ "d" : "3",'+
                          '"imgurl": "/static/imgs/reports/riqi3.png",'+
                          '"isUsed": "true",'+
                          '"HealthIndex" : "1.5"'+
                        '}'+
                      ']'+
                    '}'+
                  ']'+
                '}'+
              ']}';
    var obj = JSON.parse(res);
    // console.log(obj);
    that.setData({
      year: y,
      month: m,
      monthReports: obj
    });
    */
  }
})