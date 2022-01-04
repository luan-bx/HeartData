// pages/report/report.js

// 获取应用实例
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    reports: {}
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    // 通过http请求，加载每年前两个月的报告
    wx.showToast({ 
      title: '报告获取中...',
      icon: 'loading',
      duration: 3000
    });
    wx.request({
      url: app.globalData.domain + '/getReport',
      data: {
        pepoleid: app.globalData.pepoleid
      },
      success(res){
        if(res.data == 'error'){
          wx.showToast({
            title: '报告获取失败',
            icon: 'fail',
            duration: 2000
          });
        }else if(res.data == '500'){
          wx.showToast({
            title: '请先登陆',
            icon: 'fail',
            duration: 2000
          });
          wx.navigateTo({
            url: '/pages/login/login',
          });
        }else {
          // 解析JSON对象
          /*
    var json = '{ "data" : ['+
                '{ '+
                  '"year": "2020",'+
                  '"month": ['+
                    '{ "m": "1",' +
                      '"imgurl": "/static/imgs/reports/riqi1.png",'+
                      '"title": "1月报告",'+
                      '"description": "1月报告，良好",'+
                      '"analysis": {'+
                        '"HealthIndex": "",'+
                        '"Other": ""'+
                      '},'+
                      '"dayLists":['+
                        '{ "d" : "31",'+
                          '"isUsed": "",'+
                          '"HealthIndex" : ""'+
                        '}'+
                      ']'+
                    '},'+
                    '{ "m": "2",' +
                      '"imgurl": "/static/imgs/reports/riqi2.png",'+
                      '"title": "2月报告",'+
                      '"description": "2月报告，良好",'+
                      '"analysis": {'+
                        '"HealthIndex": "",'+
                        '"Other": ""'+
                      '},'+
                      '"dayLists":['+
                        '{ "d" : "28",'+
                          '"isUsed": "",'+
                          '"HealthIndex" : ""'+
                        '}'+
                      ']'+
                    '}'+
                  ']'+
                '},'+
                '{ '+
                  '"year": "2021",'+
                  '"month": ['+
                    '{ "m": "2",' +
                      '"imgurl": "/static/imgs/reports/riqi2.png",'+
                      '"title": "2月报告",'+
                      '"description": "2月报告，良好",'+
                      '"analysis": {'+
                        '"HealthIndex": "",'+
                        '"Other": ""'+
                      '},'+
                      '"dayLists":['+
                        '{ "d" : "31",'+
                          '"isUsed": "",'+
                          '"HealthIndex" : ""'+
                          '}'+
                        ']'+
                      '}'+
                    ']'+
                '}'+               
              ']}';
          */
          // console.log(res.data);
          // console.log(json);
          // var obj = JSON.parse(json);
          // console.log(obj);
          that.setData({
            reports: res.data
          });
        }
      }
    });
  },

  /**
   * 年度报告查看全部
   */
  yearReport: function (e) {
    wx.navigateTo({
      url: '/pages/yearReport/yearReport?year=' + e.currentTarget.id
    })
  },

  /**
   * 月报告查看详情
   */
  monthReport: function(e){
    // console.log(e);
    wx.navigateTo({
      url: '/pages/monthReport/monthReport?year=' + e.currentTarget.dataset.year + '&month=' + e.currentTarget.dataset.month
    })
  }
})