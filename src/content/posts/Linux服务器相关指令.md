---
title: Linux服务器相关指令
pubDate: 2021-12-19T20:24:48.000Z
tags: [Linux, CentOS]
category: 服务器
coverImage: "/img/Linux服务器相关指令.jpg"
---

### 添加公钥

``` bash
#创建目录及文件 不用用户需要各自添加密钥
sudo mkdir /home/conan/.ssh
sudo touch /home/conan/.ssh/authorized_keys

#修正所有者
sudo chown -R conan. /home/conan/.ssh

vim ~/.ssh/authorized_keys

#检查确认
sudo cat /home/conan/.ssh/authorized_keys

#修改权限
sudo chmod 700 /home/conan/.ssh
sudo chmod 600 /home/conan/.ssh/authorized_keys
```

### Windows生成公钥私钥

``` bash
ssh-keygen -t rsa -C "邮箱"

# 查看生成的公钥
cat ~\.ssh\id_rsa.pub
```

### 添加用户设置密码

``` bash
useradd 用户名 
passwd 用户名
#设定sudo权限
sudo visudo
conan  ALL=(ALL) NOPASSWD:ALL
```

### 设置用户权限

``` bash
vi /etc/sudoers 
sudo vim /etc/passwd
```

### 修改被远程连接服务配置

``` bash
vim /etc/ssh/sshd_config
PermitRootLogin no        #禁止root登陆
PasswordAuthentication no         #禁止密码登陆

#保存后重启sshd
sudo service sshd restart
```

### Fail2ban监狱

``` bash
sudo vi /etc/fail2ban/jail.local
# 重启服务
sudo systemctl restart fail2ban
# 测试是否成功
sudo fail2ban-client ping
# 展示监狱情况
sudo fail2ban-client status ssh-iptables
# 解放特定IP
sudo fail2ban-client set ssh-iptables unbanip 192.168.1.8
# 设置自启动
sudo systemctl enable fail2ban
```

### 使用acme.sh给hexo+nginx安装证书
``` bash
# 自动安装acme.sh
curl https://get.acme.sh | sh
# 使用自己的邮箱注册，否则无法继续
acme.sh --register-account -m my@example.com
# 生成证书
acme.sh --issue -d cnwjy.site --nginx
# 安装证书
acme.sh --install-cert -d cnwjy.site \
 --key-file /var/www/ssl/cnwjy.site.key.pem \
 --fullchain-file /var/www/ssl/cnwjy.site.cert.pem \
 --reloadcmd "service nginx force-reload"
# nginx重启
systemctl reload nginx.service
```