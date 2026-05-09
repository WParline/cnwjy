---
title: 计算机教育中缺失的一课-作业
pubDate: 2023-07-03T23:23:01.000Z
tags: [Shell, Vim, Git]
category: 学习笔记
coverImage: "/img/计算机教育中缺失的一课-作业.jpg"
---

# 计算机教育中缺失的一课-作业

## 第一天-课程概览与 shell

```bash
# 1
echo $SHELL
# out: /bin/bash

# 2
mkdir /tmp/missing

# 3
man touch

# 4
cd /tmp/missing
touch semester

# 5
echo '#!/bin/sh' > semester
echo curl --head --silent https://missing.csail.mit.edu >> semester

# 6 7 8
chmod +x semester
./semester
# out:
HTTP/2 200
server: GitHub.com
content-type: text/html; charset=utf-8
last-modified: Sat, 10 Jun 2023 13:13:30 GMT
access-control-allow-origin: *
etag: "648476fa-1f86"
expires: Fri, 30 Jun 2023 09:10:55 GMT
cache-control: max-age=600
x-proxy-cache: MISS
x-github-request-id: 68D8:0DEE:7363C9:78E07A:649E99C7
accept-ranges: bytes
date: Mon, 03 Jul 2023 16:01:06 GMT
via: 1.1 varnish
age: 0
x-served-by: cache-tyo11941-TYO
x-cache: HIT
x-cache-hits: 1
x-timer: S1688400067.585549,VS0,VE165
vary: Accept-Encoding
x-fastly-request-id: 41d45d32ac886ab559092a38d7c33736620c2d23
content-length: 8070

# 9
./semester | sed -n "4,4p" | cut -d ' ' -f 2- > last-modified.txt
cat last-modified.txt
# out: Sat, 10 Jun 2023 13:13:30 GMT

# 10
云服务器，做不了
```

## 第二天-Shell 工具和脚本

```bash
# 1
#所有文件
ls -al
#文件打印以人类可以理解的格式输出
ls -al --block-size=M
#文件以最近访问顺序排序
ls -lt
#以彩色文本显示输出结果
ls -l --color=auto

# 2
marco () {
    lastdir=$(pwd)
    echo $lastdir
}
polo () {
        cd $lastdir
}

# 3 runmagic.sh
echo "Start to find magic number..."
rm stdout.log stderr.log
while true
do
    bash cnterror.sh >> stdout.log 2> stderr.log
    if [ -s stderr.log ]; then
        break
    fi
done
echo "stderr is:"
cat stderr.log
echo "stdout is:"
cat stdout.log
runtimes=$(grep -o "Everything" stdout.log | wc -l)
echo "The cnterror.sh runs $runtimes times"

# 4
find . -type f -name "*.html" | xargs -d '\n' tar -czf somehtmls.tar.gz

# 5
find . -type f | xargs ls -lta
```

## 第三天-编辑器 (Vim)

发现网站自带答案，到这里我就不做记录啦，偶尔抽空学一下，虽然一部分已经学过了，温故知新！
