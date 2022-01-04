#include "workthread.h"
#include <QtDebug>
#include <QtSerialPort/QSerialPort>
#include <QtSerialPort/QSerialPortInfo>
#include <QDataStream>
#include <QFile>
#include <QTimer>
#include <QPointF>
#include<windows.h>
#include <QMetaType>
#include <QQueue>

WorkThread::WorkThread()
{

}
void WorkThread::run()
{
    qRegisterMetaType<QVector<QPointF>>("QVector<QPointF>");
    connect(serialPort,&QSerialPort::readyRead,this,&WorkThread::readMyCom);//数据来了就进入readMyCom函数
    //在data文件夹下面保存串口传递的数据，如果data文件夹不存在，就创建一个新的data文件夹
    if(!QFile("data").exists())  //如果跟目录不存在data文件夹，就创建data文件夹
    {
        system("md data");
    }else
    {
        qDebug()<<"data file is exists";
    }
    QDateTime currenttime=QDateTime::currentDateTime();
    QString time=currenttime.toString("MM-dd-hh-mm-ss");//时间格式
    file.setFileName("./data/"+time+"_ch1"+".txt");

    //设置file的读写方式
    file.open(QIODevice::WriteOnly|QIODevice::Append);


    for(int i=0;i<MAXSIZE;i++){   //初始化通道数据
       original_data[0][i]=0;//存储原始数据的数组进行初始化
       original_data[1][i]=0;//存储原始数据的数组进行初始化
    }


    exec();
}


void WorkThread::readMyCom(void)//读取缓冲的数据
{

    bool ok=true;

       buf=buf+serialPort->readAll().toHex();
       int buf_length=buf.length();
       QTextStream stream1(&file);


       while(buf_length>=10)   //temp[2]由temp[0]和temp[1]计算而来
       {
           if(buf[0]=='1'&&buf[1]=='1'&&buf[8]=='0'&&buf[9]=='1')
           {

               temp=buf.mid(2,6).toInt(&ok,16);

               if(temp>=8388608)
                {
                    temp=temp-16777216;//补码转换
                }

              temp=((temp*2.42)/(pow(2,23)-1))*1000;

              buf.remove(0,10);
              buf_length=buf.length();
                 stream1 << QString::number(temp,'g',10) <<'\n';
                 Chuli(temp,0);
                 Chuli(temp,1);

           }else
           {
               buf.remove(0,1);
               buf_length=buf.length();
               continue;
           }

    }
}

void WorkThread::Rev_serial(QSerialPort* main_serialPort)
{
    serialPort = new QSerialPort();
    serialPort=main_serialPort;
}

void WorkThread::Chuli(float data,int channel)
{


    QVector<QPointF> points;            //用于存放原始数据的点
    QVector<QPointF> nfaPoints;        //用于存放陷波之后的点
    QVector<QPointF> HighPassPoints;  //用于存放高通之后的点
    QVector<QPointF> LowPassPoints;
    QVector<QPointF> HuxiPoints;
    QVector<QPointF> TempPoints;
     QVector<QPointF> displayPoints;

     if(channel==0){
        for(int i=0;i<MAXSIZE-1;i++)
        {
            original_data[channel][i]=original_data[channel][i+1];
        }
        original_data[channel][MAXSIZE-1]=data;
        for(int i=0;i<MAXSIZE;i++)
        {
            points.append(QPointF(i,original_data[channel][i]));
        }
        emit sendSeries(points,channel);
     }else if(channel==1){
         for(int i=0;i<MAXSIZE-1;i++)
         {
             original_data[channel][i]=original_data[channel][i+1];
         }
         original_data[channel][MAXSIZE-1]=data;
         for(int i=0;i<MAXSIZE;i++)
         {
             points.append(QPointF(i,original_data[channel][i]));
         }
        nfaPoints=nfa(points,50,2,0.00025);
        emit sendSeries(nfaPoints,channel);
     }




}



QVector<QPointF> WorkThread::nfa(QVector<QPointF> points,float f,int a,float COEFFICIENT)
{
    QVector<QPointF> nfaPoints;
    int i=0;
    while(i<a){
        int ll=points.size();
        float test[ll];
        for (int i = 0; i < ll; ++i)
        {
            test[i] =points.at(i).y();
        }
        float y[ll];
        float wh=f*PI*COEFFICIENT;
        float Q=tan(wh);
        int p=5;
        int A=1;
        float m=1.0+Q/p+Q*Q;
        float a0=(1+Q*Q)*A/m;
        float a1=2.0*(Q*Q-1.0)*A/m;
        float a2=(Q*Q+1.0)*A/m;
        float b1 = 2.0*(Q*Q-1.0) / m;
        float b2 = (1.0 - Q/p + Q*Q) / m;
        float y1=test[0];
        float y2=test[1];
        float x1=a0*y1;
        float x2=a0*y2+a1*y1-b1*x1;
        y[0]=x1;
        y[1]=x2;
        for(int i=2;i<ll;i++){
            float y3=test[i];
            y2=test[i-1];
            y1=test[i-2];
            float x3=a0*y3+a1*y2+a2*y1-b1*x2-b2*x1;
            y[i]=x3;
            x1=x2;
            x2=x3;
        }
        i++;
        for (int i=0;i<ll;i++)
        {
            nfaPoints.append(QPointF(i,y[i]));

        }
        if(i<a){
            points.clear();
            points=nfaPoints;
            nfaPoints.clear();
        }
    }
    return nfaPoints;
}


//低通
QVector<QPointF> WorkThread::LowPass(QVector<QPointF> points, float fh,float fre)
{
    float a, Q, m;
    float b1, b2;
    float wh;
    int i;
    QVector<QPointF> LowPassPoints;
    wh = fh*3.14159265359*(float)(1.0/fre);
    Q = tan(wh);
    m = 1.0 + 1.414213*Q + Q*Q;
    a = 1.414213*Q*Q / m;
    b1 = 2.0*(Q*Q - 1.0) / m;
    b2 = (1.0 - 1.414213*Q + Q*Q) / m;
    int length=points.size();
    float y[length];
    float x[length];
    for (i = 0; i < length; i++)
    {
         y[i] = points.at(i).y();
    }

    x[0]= (float)(a*y[0]);
    x[1]= (float)(a*(y[1] + 2.0*y[0]) - b1*x[0]);
    for (i = 2; i < length; i++)//正向
    {
        x[i] = (float)(a*(y[i] + 2.0*y[i - 1] + y[i - 2]) - b1*x[i - 1] - b2*x[i - 2]);
    }

    y[ length - 1] = (float)(a*x[length - 1]);
    y[ length - 2] = (float)(a*(x[ length- 2] + 2.0*x[length- 1]) - b1*y[length- 1]);
    for (i =length- 3; i > -1; i--){//反向
        y[i] = (float)(a*(x[i] + 2.0*x[i + 1] + x[i + 2]) - b1*y[i + 1] - b2*y[i + 2]);
    }

    for (i = 0; i <length; i++)
    {
      LowPassPoints.append(QPointF(i,y[i]));

    }
    return LowPassPoints;
}


//高通
QVector<QPointF> WorkThread::HighPass(QVector<QPointF> points, float fh,float fre)
{
    float a, Q, m;
    float b1, b2;
    float wh;
    int i;
    QVector<QPointF> HighPassPoints;
    wh = fh*3.14159265359*(float)(1.0/fre);
    Q = tan(wh);
    m = 1.0 + 1.414213*Q + Q*Q;
    a = 1.0 / m;
    b1 = 2.0*(Q*Q - 1.0) / m;
    b2 = (1.0 - 1.414213*Q + Q*Q) / m;
    float y[points.size()];
    float x[points.size()];
    for (i = 0; i < points.size(); i++)
    {
         y[i] = points.at(i).y();
    }

    x[0]= (float)(a*y[0]);
    x[1]= (float)(a*(y[1] - 2.0*y[0]) - x[0]);
    for (i = 2; i < points.size(); i++)//正向
    {
        x[i] = (float)(a*(y[i] - 2.0*y[i - 1] + y[i - 2]) - b1*x[i - 1] - b2*x[i - 2]);
    }

    y[ points.size() - 1] = (float)(a*x[points.size() - 1]);
    y[ points.size() - 2] = (float)(a*(x[ points.size()- 2] - 2.0*x[points.size()- 1]) - b1*y[points.size()- 1]);
    for (i =points.size()- 3; i > -1; i--){//反向
        y[i] = (float)(a*(x[i] - 2.0*x[i + 1] + x[i + 2]) - b1*y[i + 1] - b2*y[i + 2]);
    }

    for (i = 0; i <points.size(); i++)
    {
      HighPassPoints.append(QPointF(i,y[i]));

    }
    return HighPassPoints;
}
