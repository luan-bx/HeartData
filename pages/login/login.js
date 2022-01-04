// pages/login/login.js

// 获取应用实例
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
  },
  loadUserInfo: function (e) {
    wx.getUserProfile({
      desc: '获取用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        // console.log(res)
        this.setData({
          userInfo: res.userInfo
        }),
        // 存储用户基本信息
        app.globalData.userInfo = res.userInfo;
        wx.showToast({ 
          title: '加载中...',
          icon: 'loading',
          duration: 5000
        });
        // 与服务端交互
        wx.login({
          success (res) {
            if (res.code) {
              //发起网络请求
              // console.log(res);
              wx.request({
                url: app.globalData.domain + '/wxLogin',
                data: {
                  code: res.code,
                  nickName: app.globalData.userInfo.nickName,
                  avatarUrl: app.globalData.userInfo.avatarUrl,
                  gender: app.globalData.userInfo.gender,
                  city: app.globalData.userInfo.city,
                  province: app.globalData.userInfo.province
                },
                // 请求后端服务器成功回调
                // 服务端返回openId
                success(result){
                  // console.log(result.data);
                  if(result.data != "error"){
                    app.globalData.pepoleid = result.data;
                    // console.log(app.globalData.openid);
                    wx.switchTab({
                      url: '/pages/index/index'
                    })
                  }else {
                    wx.showToast({
                      title: '登陆/注册失败',
                      icon: 'fail',
                      duration: 2000
                    });
                  }
                },
                // 请求后端服务器失败回调
                fail(res){
                  wx.showToast({
                    title: '登陆失败',
                    icon: 'fail',
                    duration: 2000
                  });
                  // console.log(res);
                }
              })
            } else {
              // console.log('登录失败！' + res.errMsg)
            }
          }
        });
      }
    })
  }
})