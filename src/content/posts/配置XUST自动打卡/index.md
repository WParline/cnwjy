---
title: 配置XUST自动打卡
coverImage: "/img/配置XUST自动打卡.jpg"
pubDate: 2022-04-10T19:59:48.000Z
tags: [Linux, Ubuntu, Python, Anaconda, Screen]
category: 服务器
---

## 安装screen

```bash	
apt-get update
apt install screen
```

## 安装Anaconda

下载Anaconda安装包，安装包链接可自行替换，注意wget的下载路径（会把文件下载到当前路径）

```bash	
wget https://repo.anaconda.com/archive/Anaconda3-2021.11-Linux-x86_64.sh
```

执行安装包，安装过程中记得conda init 选择 yes

```bash
bash Anaconda3-2021.11-Linux-x86_64.sh
```

刷新bash环境，否则不认识conda命令

```bash
source ~/.bashrc
```

conda取消默认激活base环境

```bash
conda config --set auto_activate_base false
```

## 创建打卡专属环境

创建Anaconda虚拟环境并激活

```bash
conda create -n auto python==3.10
conda activate auto
```

在虚拟环境激活的情况下，补充安装打卡需要的第三方库

```bash
pip install selenium
```

安装chrome浏览器

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo apt install ./google-chrome-stable_current_amd64.deb
```

查看chrome浏览器版本，并于[chromedriver镜像](https://registry.npmmirror.com/binary.html?path=chromedriver/)下载对应版本的chromedriver（记得解压），放于/usr/bin目录，并赋予权限

```bash
google-chrome --version
cd /usr/bin
chmod +x chromedriver
```

创建定时任务

```bash
crontab -e

PATH=$PATH:/root/anaconda3/bin
MAILTO=root
30 17 * * * conda activate auto; python ~/niceAuto/niceAuto.py; conda deactivate;
```

