// pages/ble/ble.js
// 获取应用实例
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bleLists: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    console.log(app.globalData.bleLists);
    that.setData({
      bleLists: app.globalData.bleLists
    });
  },
  // 点击事件，连接蓝牙
  connectBle: function (res) {
    app.globalData.selectedBleId = res.currentTarget.dataset.id;
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})