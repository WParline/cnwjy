---
title: Linux From Scratch 11.3 实践
pubDate: 2023-05-05T18:55:41.000Z
tags: [LFS, Linux]
category: Linux学习
coverImage: "/img/Linux-From-Scratch-11-3-实践.jpg"
---

# Linux From Scratch 11.3 实践

> 警告：此次实践已经失败，可做参考但不建议照做，如有兴趣可参考下一篇文章

LFS官方提供[中文文档](https://www.linuxfromscratch.org/lfs/read.html)

## 1. 准备工作

笔者拟采用笔记本的双系统中的Ubuntu当作宿主机，但当想到后面会进行分区时，可能会由于自己的误操作把笔记本原双系统的分区搞坏，于是撇弃了这个想法，再说还是Windows系统玩游戏方便。

不用已经装好的系统那就用虚拟机或者WSL。其中WSL的话并不清楚WSL是否很好的避免分区的问题，毕竟我分区懂的不多。而使用VirtualBox等工具可以很好的解决分区的问题，只需要分配足够的内存给到虚拟机就行。

### 1.1. 虚拟机工具选择

VirtualBox和VMmare当中我选择VirtualBox，VMmare感觉体量太大，之前有过使用经历，这次尝试一下感觉小巧玲珑的VirtualBox。

### 1.2. 宿主机系统选择

刚开始想尝试Ubuntu，但是LFS文档中的推荐并没有列出，保险起见选择了列出的Debian，相比于其他三个Debian较受欢迎。

[debian-11.7.0-amd64-netinst.iso](https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-11.7.0-amd64-netinst.iso)是我选择的版本，在官网上可以看到其内核版本为5.10以上，符合LFS文档中3.2以上的要求。

### 1.3. 安装Debian虚拟机

先不选择镜像文件，不要自动安装。内存给了8G，CPU核心给了8个，~~虚拟硬盘给了100G~~，虚拟硬盘给50G就行，一次性给完，剩下50G可以之后再添加一个盘专门放LFS分区（这似乎是一个更好的选择），LFS分区与宿主机同处一个硬盘不知道会出什么影响。其他选项默认。启动然后选择镜像文件进行安装，不要自动安装。不能断网。时间会很久，慢慢等。

~~分区选择手动，先用50G，剩下50G留给LFS，不知道这样对不对。~~

分区选择手动，用完分配的50G。

设一个40G的主分区，ext4格式。设一个10G的逻辑分区，用作swap分区。LFS文档中有提到SWAP分区，不是很懂，先留一个。

安装过程中设置了GRUB，希望不会影响LFS。

为了不频繁切换，且使用方便，需要用vscode连接虚拟机，修改虚拟机网卡为桥接模式

### 1.4. 检查Debian的软件环境

使用LFS文档提供的命令

```bash
cat > version-check.sh << "EOF"
#!/bin/bash
# Simple script to list version numbers of critical development tools
export LC_ALL=C
bash --version | head -n1 | cut -d" " -f2-4
MYSH=$(readlink -f /bin/sh)
echo "/bin/sh -> $MYSH"
echo $MYSH | grep -q bash || echo "ERROR: /bin/sh does not point to bash"
unset MYSH
echo -n "Binutils: "; ld --version | head -n1 | cut -d" " -f3-
bison --version | head -n1
if [ -h /usr/bin/yacc ]; then
 echo "/usr/bin/yacc -> `readlink -f /usr/bin/yacc`";
elif [ -x /usr/bin/yacc ]; then
 echo yacc is `/usr/bin/yacc --version | head -n1`
else
 echo "yacc not found"
fi
echo -n "Coreutils: "; chown --version | head -n1 | cut -d")" -f2
diff --version | head -n1
find --version | head -n1
gawk --version | head -n1
if [ -h /usr/bin/awk ]; then
 echo "/usr/bin/awk -> `readlink -f /usr/bin/awk`";
elif [ -x /usr/bin/awk ]; then
 echo awk is `/usr/bin/awk --version | head -n1`
else
 echo "awk not found"
fi
gcc --version | head -n1
g++ --version | head -n1
grep --version | head -n1
gzip --version | head -n1
cat /proc/version
m4 --version | head -n1
make --version | head -n1
patch --version | head -n1
echo Perl `perl -V:version`
python3 --version
sed --version | head -n1
tar --version | head -n1
makeinfo --version | head -n1 # texinfo version
xz --version | head -n1
echo 'int main(){}' > dummy.c && g++ -o dummy dummy.c
if [ -x dummy ]
 then echo "g++ compilation OK";
 else echo "g++ compilation failed"; fi
rm -f dummy.c dummy
EOF
bash version-check.sh
```

脚本的输出是

```
bash, version 5.1.4(1)-release
/bin/sh -> /usr/bin/dash
ERROR: /bin/sh does not point to bash
Binutils: yacc not found
Coreutils:  8.32
diff (GNU diffutils) 3.7
find (GNU findutils) 4.8.0
/usr/bin/awk -> /usr/bin/mawk
grep (GNU grep) 3.6
gzip 1.10
Linux version 5.10.0-22-amd64 (debian-kernel@lists.debian.org) (gcc-10 (Debian 10.2.1-6) 10.2.1 20210110, GNU ld (GNU Binutils for Debian) 2.35.2) #1 SMP Debian 5.10.178-3 (2023-04-22)
Perl version='5.32.1';
Python 3.9.2
sed (GNU sed) 4.7
tar (GNU tar) 1.34
xz (XZ Utils) 5.2.5
g++ compilation failed
```

额外的报错

```bash
version-check.sh: line 9: ld: command not found
version-check.sh: line 10: bison: command not found
version-check.sh: line 21: gawk: command not found
version-check.sh: line 29: gcc: command not found
version-check.sh: line 30: g++: command not found
version-check.sh: line 34: m4: command not found
version-check.sh: line 35: make: command not found
version-check.sh: line 36: patch: command not found
version-check.sh: line 41: makeinfo: command not found
version-check.sh: line 43: g++: command not found
```

从以上信息可以得到

- bash版本为5.1.4，大于3.2，暂视为合格
- ~~/bin/sh没有指向bash~~
- ~~Binutils未正确安装~~
- ~~Bison尚未安装~~
- Coreutils版本为8.32，大于6.9，暂视为合格
- Diffutils版本暂视为合格
- Findutils版本暂视为合格
- ~~Gawk未正确安装~~
- ~~GCC尚未安装~~
- Grep版本暂视为合格
- Gzip版本暂视为合格
- Linux内核版本暂视为合格
- ~~M4尚未安装~~
- ~~Make尚未安装~~
- ~~Patch尚未安装~~
- Perl版本暂视为合格
- Python版本暂视为合格
- Sed版本暂视为合格
- Tar版本暂视为合格
- ~~Texinfo尚未安装~~
- Xz版本暂视为合格

接下来以root用户开始解决出现的问题

#### [/bin/sh指向bash](https://blog.csdn.net/gatieme/article/details/52136411)

```bash
dpkg-reconfigure dash
# 查看结果
readlink -f /bin/sh
```

#### 安装ld获取Binutils版本

```bash
apt install libvcflib-tools
# 查看结果
echo -n "Binutils: "; ld --version | head -n1 | cut -d" " -f3-
```

#### 安装Bison，安装完成后已自动链接

```bash
apt install bison
# 查看结果
bison --version | head -n1
```

#### 安装Gawk，安装完成后已自动链接

```bash
apt install gawk
# 查看结果
gawk --version | head -n1
```

#### 安装GCC

安装ld时已顺带安装

#### 安装M4

安装ld时已顺带安装

#### 安装Make

安装ld时已顺带安装

#### 安装Patch

安装ld时已顺带安装

#### 安装Texinfo

```bash
apt install texinfo
# 查看结果
makeinfo --version | head -n1
```

#### 再次检查软件环境

结果如下

```
bash, version 5.1.4(1)-release
/bin/sh -> /usr/bin/bash
Binutils: (GNU Binutils for Debian) 2.35.2
bison (GNU Bison) 3.7.5
/usr/bin/yacc -> /usr/bin/bison.yacc
Coreutils:  8.32
diff (GNU diffutils) 3.7
find (GNU findutils) 4.8.0
GNU Awk 5.1.0, API: 3.0 (GNU MPFR 4.1.0, GNU MP 6.2.1)
/usr/bin/awk -> /usr/bin/gawk
gcc (Debian 10.2.1-6) 10.2.1 20210110
g++ (Debian 10.2.1-6) 10.2.1 20210110
grep (GNU grep) 3.6
gzip 1.10
Linux version 5.10.0-22-amd64 (debian-kernel@lists.debian.org) (gcc-10 (Debian 10.2.1-6) 10.2.1 20210110, GNU ld (GNU Binutils for Debian) 2.35.2) #1 SMP Debian 5.10.178-3 (2023-04-22)
m4 (GNU M4) 1.4.18
GNU Make 4.3
GNU patch 2.7.6
Perl version='5.32.1';
Python 3.9.2
sed (GNU sed) 4.7
tar (GNU tar) 1.34
texi2any (GNU texinfo) 6.7
xz (XZ Utils) 5.2.5
g++ compilation OK
```

一切看起来井然有序

### 1.5. 创建新的分区

创建虚拟机的时候，我使用了一块100GB的由Virtual Box提供的硬盘，且还剩下50G没用，就拿这剩下的50G空间当作LFS的分区。

```bash
cfdisk
# 进入可视化界面后选择Free space，点击New，之后点击Write，然后Quit退出即可
```

于是我们得到了一个LFS分区，设备名为/dev/sda3，由于可以共用swap，此时也记录一下swap的设备名，为/dev/sda5。

### 1.6. 在分区上建立文件系统

根据LFS文档，有以下操作

```bash
mkfs -v -t ext4 /dev/sda3
```

我已有swap分区，不必新建swap分区。

### 1.7. 设置$LFS环境变量

为了避免$LFS环境变量在切换用户之后会失效，我将修改宿主机中所有用户的bashrc，向其添加**export LFS=/mnt/lfs**。

默认使用/mnt/lfs目录。

```bash
su -
cd /root
vi .bashrc
su lsf
cd /home
vi .bashrc
```

### 1.8. 挂载新的分区

傻瓜式跟着LFS文档走（终于！前面部分我倒是希望手册能教我）。做到这里，突然有些理解了LFS文档中的2.4.1其它分区问题。我还是先就一个分区进行吧

```bash
mkdir -pv $LFS
mount -v -t ext4 /dev/sda3 $LFS
```

我势必会重启计算机，所以，我需要在虚拟机启动时自动挂载LFS分区，所以，添加一行命令

```bash
su -
vi /etc/fstab
```

同时，我们也有swap分区，启用它（可能宿主机已经启用了，使用这条命令就会显示设备繁忙，fstab文件中似乎也已经存在了swap分区的自动挂载）。

```bash
/sbin/swapon -v /dev/<zzz>
```

### 1.9. 下载需要的软件包

#### 创建资源包目录

```bash
mkdir -v $LFS/sources
chmod -v a+wt $LFS/sources
```

#### 下载资源

镜像中包含了软件包和补丁

```bash
su -
wget --input-file=https://mirrors.ustc.edu.cn/lfs/lfs-packages/11.3/ --continue --directory-prefix=$LFS/sources
```

#### 运行正确性检查

```bash
pushd $LFS/sources
 md5sum -c md5sums
popd
```

### 1.10 在LFS文件系统中创建有限目录布局

```bash
mkdir -pv $LFS/{etc,var} $LFS/usr/{bin,lib,sbin}
for i in bin lib sbin; do
 ln -sv usr/$i $LFS/$i
done
case $(uname -m) in
 x86_64) mkdir -pv $LFS/lib64 ;;
esac

mkdir -pv $LFS/tools
```

### 1.11 添加LFS用户

```bash
su -

groupadd lfs
useradd -s /bin/bash -g lfs -m -k /dev/null lfs

passwd lfs

chown -v lfs $LFS/{usr{,/*},lib,var,etc,bin,sbin,tools}
case $(uname -m) in
 x86_64) chown -v lfs $LFS/lib64 ;;
esac

# 修改.bashrc 添加$LFS环境变量
```

以lfs的身份执行以下命令

```
cat > ~/.bash_profile << "EOF"
exec env -i HOME=$HOME TERM=$TERM PS1='\u:\w\$ ' /bin/bash
EOF

cat > ~/.bashrc << "EOF"
set +h
umask 022
LFS=/mnt/lfs
LC_ALL=POSIX
LFS_TGT=$(uname -m)-lfs-linux-gnu
PATH=/usr/bin
if [ ! -L /bin ]; then PATH=/bin:$PATH; fi
PATH=$LFS/tools/bin:$PATH
CONFIG_SITE=$LFS/usr/share/config.site
export LFS LC_ALL LFS_TGT PATH CONFIG_SITE
EOF
```

因为debian这个版本存在bash.bashrc，所以在root下运行

```bash
[ ! -e /etc/bash.bashrc ] || mv -v /etc/bash.bashrc /etc/bash.bashrc.NOUSE
```

在lfs下运行

```bash
source ~/.bash_profile
```

## 2. 编译交叉⼯具链

编译的程序会被安装在$LFS/tools ⽬录中，请以lfs身份进行以下操作

### 2.1. Binutils-2.40 第一遍

```bash
tar -xf binutils-2.40.tar.xz
cd binutils-2.40

mkdir -v build
cd build

../configure --prefix=$LFS/tools \
 --with-sysroot=$LFS \
 --target=$LFS_TGT \
 --disable-nls \
 --enable-gprofng=no \
 --disable-werror
 
 make -j8
 
 make install
 
 cd $LFS/sources
 rm -rf binutils-2.40/
```

### 2.2. GCC-12.2.0 第一遍

```bash
tar -xf gcc-12.2.0.tar.xz
cd gcc-12.2.0

tar -xf ../mpfr-4.2.0.tar.xz
mv -v mpfr-4.2.0 mpfr
tar -xf ../gmp-6.2.1.tar.xz
mv -v gmp-6.2.1 gmp
tar -xf ../mpc-1.3.1.tar.gz
mv -v mpc-1.3.1 mpc

case $(uname -m) in
 x86_64)
 sed -e '/m64=/s/lib64/lib/' \
 -i.orig gcc/config/i386/t-linux64
 ;;
esac

mkdir -v build
cd build

../configure \
 --target=$LFS_TGT \
 --prefix=$LFS/tools \
 --with-glibc-version=2.37 \
 --with-sysroot=$LFS \
 --with-newlib \
 --without-headers \
 --enable-default-pie \
 --enable-default-ssp \
 --disable-nls \
 --disable-shared \
 --disable-multilib \
 --disable-threads \
 --disable-libatomic \
 --disable-libgomp \
 --disable-libquadmath \
 --disable-libssp \
 --disable-libvtv \
 --disable-libstdcxx \
 --enable-languages=c,c++
 
make -j8
 
make install
 
cd ..
cat gcc/limitx.h gcc/glimits.h gcc/limity.h > \
  `dirname $($LFS_TGT-gcc -print-libgcc-file-name)`/install-tools/include/limits.h
  
cd $LFS/sources/
rm -rf gcc-12.2.0
```

### 2.3. Linux-6.1.11 API 头文件

```bash
tar -xf linux-6.1.11.tar.xz
cd linux-6.1.11

make mrproper
make headers
find usr/include -type f ! -name '*.h' -delete
cp -rv usr/include $LFS/usr

cd $LFS/sources/
rm -rf linux-6.1.11
```

### 2.4. Glibc-2.37

```bash
tar -xf glibc-2.37.tar.xz
cd glibc-2.37

case $(uname -m) in
    i?86)   ln -sfv ld-linux.so.2 $LFS/lib/ld-lsb.so.3
    ;;
    x86_64) ln -sfv ../lib/ld-linux-x86-64.so.2 $LFS/lib64
            ln -sfv ../lib/ld-linux-x86-64.so.2 $LFS/lib64/ld-lsb-x86-64.so.3
    ;;
esac

patch -Np1 -i ../glibc-2.37-fhs-1.patch

mkdir -v build
cd build

echo "rootsbindir=/usr/sbin" > configparms

../configure \
 --prefix=/usr \
 --host=$LFS_TGT \
 --build=$(../scripts/config.guess) \
 --enable-kernel=3.2 \
 --with-headers=$LFS/usr/include \
 libc_cv_slibdir=/usr/lib
 
make -j8

make DESTDIR=$LFS install

sed '/RTLDLIST=/s@/usr@@g' -i $LFS/usr/bin/ldd

cd $LFS/sources/
rm -rf glibc-2.37
```

确认目前一切正常

```bash
echo 'int main(){}' | $LFS_TGT-gcc -xc -
readelf -l a.out | grep ld-linux

rm -v a.out
```

完成一部分安装

```bash
$LFS/tools/libexec/gcc/$LFS_TGT/12.2.0/install-tools/mkheaders
```

### 2.5. GCC-12.2.0 中的Libstdc++

```bash
tar -xf gcc-12.2.0.tar.xz
cd gcc-12.2.0

mkdir -v build
cd build

../libstdc++-v3/configure \
 --host=$LFS_TGT \
 --build=$(../config.guess) \
 --prefix=/usr \
 --disable-multilib \
 --disable-nls \
 --disable-libstdcxx-pch \
 --with-gxx-include-dir=/tools/$LFS_TGT/include/c++/12.2.0

make -j8

make DESTDIR=$LFS install

rm -v $LFS/usr/lib/lib{stdc++,stdc++fs,supc++}.la

cd $LFS/sources/
rm -rf gcc-12.2.0
```

### 2.6. M4-1.4.19

```bash
tar -xf m4-1.4.19.tar.xz
cd m4-1.4.19

./configure --prefix=/usr \
 --host=$LFS_TGT \
 --build=$(build-aux/config.guess)
 
make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf m4-1.4.19
```

### 2.7. Ncurses-6.4

```bash
tar -xf ncurses-6.4.tar.gz
cd ncurses-6.4

sed -i s/mawk// configure

mkdir build
pushd build
 ../configure
 make -C include
 make -C progs tic
popd

./configure --prefix=/usr \
 --host=$LFS_TGT \
 --build=$(./config.guess) \
 --mandir=/usr/share/man \
 --with-manpage-format=normal \
 --with-shared \
 --without-normal \
 --with-cxx-shared \
 --without-debug \
 --without-ada \
 --disable-stripping \
 --enable-widec

make -j8

make DESTDIR=$LFS TIC_PATH=$(pwd)/build/progs/tic install
echo "INPUT(-lncursesw)" > $LFS/usr/lib/libncurses.so

cd $LFS/sources
rm -rf ncurses-6.4
```

### 2.8. Bash-5.2.15

```bash
tar -xf bash-5.2.15.tar.gz
cd bash-5.2.15

./configure --prefix=/usr \
 --build=$(sh support/config.guess) \
 --host=$LFS_TGT \
 --without-bash-malloc
 
make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf bash-5.2.15
```

### 2.9. Coreutils-9.1

```bash
tar -xf coreutils-9.1.tar.xz
cd coreutils-9.1

./configure --prefix=/usr \
 --host=$LFS_TGT \
 --build=$(build-aux/config.guess) \
 --enable-install-program=hostname \
 --enable-no-install-program=kill,uptime

make -j8

make DESTDIR=$LFS install

mv -v $LFS/usr/bin/chroot              $LFS/usr/sbin
mkdir -pv $LFS/usr/share/man/man8
mv -v $LFS/usr/share/man/man1/chroot.1 $LFS/usr/share/man/man8/chroot.8
sed -i 's/"1"/"8"/'                    $LFS/usr/share/man/man8/chroot.8

cd $LFS/sources/
rm -rf coreutils-9.1
```

### 2.10. Diffutils-3.9

```bash
tar -xf diffutils-3.9.tar.xz
cd diffutils-3.9

./configure --prefix=/usr --host=$LFS_TGT

make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf diffutils-3.9
```

### 2.11. File-5.44

```bash
tar -xf file-5.44.tar.gz
cd file-5.44

mkdir build
pushd build
 ../configure --disable-bzlib \
 --disable-libseccomp \
 --disable-xzlib \
 --disable-zlib
 make
popd

./configure --prefix=/usr --host=$LFS_TGT --build=$(./config.guess)

make FILE_COMPILE=$(pwd)/build/src/file

make DESTDIR=$LFS install

rm -v $LFS/usr/lib/libmagic.la

cd $LFS/sources/
rm -rf file-5.44
```

### 2.12. Findutils-4.9.0

```bash
tar -xf findutils-4.9.0.tar.xz
cd findutils-4.9.0

./configure --prefix=/usr \
 --localstatedir=/var/lib/locate \
 --host=$LFS_TGT \
 --build=$(build-aux/config.guess)

make -j8

make DESTDIR=$LFS install

cd $LFS/sources
rm -rf findutils-4.9.0
```

### 2.13. Gawk-5.2.1

```bash
tar -xf gawk-5.2.1.tar.xz
cd gawk-5.2.1

sed -i 's/extras//' Makefile.in

./configure --prefix=/usr \
 --host=$LFS_TGT \
 --build=$(build-aux/config.guess)

make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf gawk-5.2.1
```

### 2.14. Grep-3.8

```bash
tar -xf grep-3.8.tar.xz
cd grep-3.8

./configure --prefix=/usr \
 --host=$LFS_TGT

make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf grep-3.8
```

### 2.15. Gzip-1.12

```bash
tar -xf gzip-1.12.tar.xz
cd gzip-1.12

./configure --prefix=/usr --host=$LFS_TGT

make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf gzip-1.12
```

### 2.16. Make-4.4

```bash
tar -xf make-4.4.tar.gz
cd make-4.4

sed -e '/ifdef SIGPIPE/,+2 d' \
 -e '/undef FATAL_SIG/i FATAL_SIG (SIGPIPE);' \
 -i src/main.c

./configure --prefix=/usr \
 --without-guile \
 --host=$LFS_TGT \
 --build=$(build-aux/config.guess)

make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf make-4.4
```

### 2.17. Patch-2.7.6

```bash
tar -xf patch-2.7.6.tar.xz
cd patch-2.7.6

./configure --prefix=/usr \
 --host=$LFS_TGT \
 --build=$(build-aux/config.guess)

make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf patch-2.7.6
```

### 2.18. Sed-4.9

```bash
tar -xf sed-4.9.tar.xz
cd sed-4.9

./configure --prefix=/usr \
 --host=$LFS_TGT
 
make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf sed-4.9
```

### 2.19. Tar-1.34

```bash
tar -xf tar-1.34.tar.xz
cd tar-1.34

./configure --prefix=/usr \
 --host=$LFS_TGT \
 --build=$(build-aux/config.guess)

make -j8

make DESTDIR=$LFS install

cd $LFS/sources/
rm -rf tar-1.34
```

### 2.20. Xz-5.4.1

```bash
tar -xf xz-5.4.1.tar.xz
cd xz-5.4.1

./configure --prefix=/usr \
 --host=$LFS_TGT \
 --build=$(build-aux/config.guess) \
 --disable-static \
 --docdir=/usr/share/doc/xz-5.4.1

make -j8

make DESTDIR=$LFS install

rm -v $LFS/usr/lib/liblzma.la

cd $LFS/sources/
rm -rf xz-5.4.1
```

### 2.21. Binutils-2.40 第二遍

```bash
tar -xf binutils-2.40.tar.xz
cd binutils-2.40

mkdir -v build
cd build

../configure \
 --prefix=/usr \
 --build=$(../config.guess) \
 --host=$LFS_TGT \
 --disable-nls \
 --enable-shared \
 --enable-gprofng=no \
 --disable-werror \
 --enable-64-bit-bfd

make -j8

make DESTDIR=$LFS install

rm -v $LFS/usr/lib/lib{bfd,ctf,ctf-nobfd,opcodes}.{a,la}

cd $LFS/sources/
rm -rf binutils-2.40
```

### 2.22. GCC-12.2.0 第二遍

```bash
tar -xf gcc-12.2.0.tar.xz
cd gcc-12.2.0

tar -xf ../mpfr-4.2.0.tar.xz
mv -v mpfr-4.2.0 mpfr
tar -xf ../gmp-6.2.1.tar.xz
mv -v gmp-6.2.1 gmp
tar -xf ../mpc-1.3.1.tar.gz
mv -v mpc-1.3.1 mpc

case $(uname -m) in
 x86_64)
 sed -e '/m64=/s/lib64/lib/' -i.orig gcc/config/i386/t-linux64
 ;;
esac

sed '/thread_header =/s/@.*@/gthr-posix.h/' \
 -i libgcc/Makefile.in libstdc++-v3/include/Makefile.in

mkdir -v build
cd build

../configure \
 --build=$(../config.guess) \
 --host=$LFS_TGT \
 --target=$LFS_TGT \
 LDFLAGS_FOR_TARGET=-L$PWD/$LFS_TGT/libgcc \
 --prefix=/usr \
 --with-build-sysroot=$LFS \
 --enable-default-pie \
 --enable-default-ssp \
 --disable-nls \
 --disable-multilib \
 --disable-libatomic \
 --disable-libgomp \
 --disable-libquadmath \
 --disable-libssp \
 --disable-libvtv \
 --enable-languages=c,c++

make -j8

make DESTDIR=$LFS install

ln -sv gcc $LFS/usr/bin/cc

cd $LFS/sources/
rm -rf gcc-12.2.0
```

## 3. 进⼊ Chroot 并构建其他临时⼯具

此时需要切换为root用户，同时需要将分区内$LFS的所有内容所有者变为root

此时估计是由于此前设置的原因，终端中，不再以`root@xxx`的形式展示，而是改为了`-bash-5.1`，这仍是root

```bash
chown -R root:root $LFS/{usr,lib,var,etc,bin,sbin,tools}
case $(uname -m) in
 x86_64) chown -R root:root $LFS/lib64 ;;
esac
```

### 3.1. 准备虚拟内核⽂件系统

```bash
mkdir -pv $LFS/{dev,proc,sys,run}
```

### 3.2. 挂载和填充/dev

```bash
mount -v --bind /dev $LFS/dev
```

### 3.3. 挂载虚拟内核文件系统

```bash
mount -v --bind /dev/pts $LFS/dev/pts
mount -vt proc proc $LFS/proc
mount -vt sysfs sysfs $LFS/sys
mount -vt tmpfs tmpfs $LFS/run

if [ -h $LFS/dev/shm ]; then
 mkdir -pv $LFS/$(readlink $LFS/dev/shm)
else
 mount -t tmpfs -o nosuid,nodev tmpfs $LFS/dev/shm
fi
```

### 3.4. 进入Chroot环境

```bash
chroot "$LFS" /usr/bin/env -i \
 HOME=/root \
 TERM="$TERM" \
 PS1='(lfs chroot) \u:\w\$ ' \
 PATH=/usr/bin:/usr/sbin \
 /bin/bash --login
```

接下来在退出Chroot环境之前，都不要关机了，一次性走完

### 3.5. 创建目录

```bash
mkdir -pv /{boot,home,mnt,opt,srv}

mkdir -pv /etc/{opt,sysconfig}
mkdir -pv /lib/firmware
mkdir -pv /media/{floppy,cdrom}
mkdir -pv /usr/{,local/}{include,src}
mkdir -pv /usr/local/{bin,lib,sbin}
mkdir -pv /usr/{,local/}share/{color,dict,doc,info,locale,man}
mkdir -pv /usr/{,local/}share/{misc,terminfo,zoneinfo}
mkdir -pv /usr/{,local/}share/man/man{1..8}
mkdir -pv /var/{cache,local,log,mail,opt,spool}
mkdir -pv /var/lib/{color,misc,locate}

ln -sfv /run /var/run
ln -sfv /run/lock /var/lock

install -dv -m 0750 /root
install -dv -m 1777 /tmp /var/tmp
```

### 3.6. 创建必要的文件和符号链接

```bash
ln -sv /proc/self/mounts /etc/mtab

cat > /etc/hosts << EOF
127.0.0.1 localhost $(hostname)
::1 localhost
EOF

cat > /etc/passwd << "EOF"
root:x:0:0:root:/root:/bin/bash
bin:x:1:1:bin:/dev/null:/usr/bin/false
daemon:x:6:6:Daemon User:/dev/null:/usr/bin/false
messagebus:x:18:18:D-Bus Message Daemon User:/run/dbus:/usr/bin/false
systemd-journal-gateway:x:73:73:systemd Journal Gateway:/:/usr/bin/false
systemd-journal-remote:x:74:74:systemd Journal Remote:/:/usr/bin/false
systemd-journal-upload:x:75:75:systemd Journal Upload:/:/usr/bin/false
systemd-network:x:76:76:systemd Network Management:/:/usr/bin/false
systemd-resolve:x:77:77:systemd Resolver:/:/usr/bin/false
systemd-timesync:x:78:78:systemd Time Synchronization:/:/usr/bin/false
systemd-coredump:x:79:79:systemd Core Dumper:/:/usr/bin/false
uuidd:x:80:80:UUID Generation Daemon User:/dev/null:/usr/bin/false
systemd-oom:x:81:81:systemd Out Of Memory Daemon:/:/usr/bin/false
nobody:x:65534:65534:Unprivileged User:/dev/null:/usr/bin/false
EOF

cat > /etc/group << "EOF"
root:x:0:
bin:x:1:daemon
sys:x:2:
kmem:x:3:
tape:x:4:
tty:x:5:
daemon:x:6:
floppy:x:7:
disk:x:8:
lp:x:9:
dialout:x:10:
audio:x:11:
video:x:12:
utmp:x:13:
usb:x:14:
cdrom:x:15:
adm:x:16:
messagebus:x:18:
systemd-journal:x:23:
input:x:24:
mail:x:34:
kvm:x:61:
systemd-journal-gateway:x:73:
systemd-journal-remote:x:74:
systemd-journal-upload:x:75:
systemd-network:x:76:
systemd-resolve:x:77:
systemd-timesync:x:78:
systemd-coredump:x:79:
uuidd:x:80:
systemd-oom:x:81:
wheel:x:97:
users:x:999:
nogroup:x:65534:
EOF

echo "tester:x:101:101::/home/tester:/bin/bash" >> /etc/passwd
echo "tester:x:101:" >> /etc/group
install -o tester -d /home/tester

exec /usr/bin/bash --login

touch /var/log/{btmp,lastlog,faillog,wtmp}
chgrp -v utmp /var/log/lastlog
chmod -v 664 /var/log/lastlog
chmod -v 600 /var/log/btmp
```

### 3.7. Gettext-0.21.1

```bash
tar -xf gettext-0.21.1.tar.xz
cd gettext-0.21.1

./configure --disable-shared

make

cp -v gettext-tools/src/{msgfmt,msgmerge,xgettext} /usr/bin

cd ..
rm -rf gettext-0.21.1
```

### 3.8. Bison-3.8.2

```bash
tar -xf bison-3.8.2.tar.xz
cd bison-3.8.2

./configure --prefix=/usr \
 --docdir=/usr/share/doc/bison-3.8.2
 
make
 
make install

cd ..
rm -rf bison-3.8.2
```

### 3.9. Perl-5.36.0

```bash
tar -xf perl-5.36.0.tar.xz
cd perl-5.36.0

sh Configure -des \
 -Dprefix=/usr \
 -Dvendorprefix=/usr \
 -Dprivlib=/usr/lib/perl5/5.36/core_perl \
 -Darchlib=/usr/lib/perl5/5.36/core_perl \
 -Dsitelib=/usr/lib/perl5/5.36/site_perl \
 -Dsitearch=/usr/lib/perl5/5.36/site_perl \
 -Dvendorlib=/usr/lib/perl5/5.36/vendor_perl \
 -Dvendorarch=/usr/lib/perl5/5.36/vendor_perl

make

make install

cd ..
rm -rf perl-5.36.0
```

### 3.10. Python-3.11.2

```bash
tar -xf Python-3.11.2.tar.xz
cd Python-3.11.2

./configure --prefix=/usr \
 --enable-shared \
 --without-ensurepip
 
make

make install

cd ..

rm -rf Python-3.11.2
```

### 3.11. Texinfo-7.0.2

```bash
tar -xf texinfo-7.0.2.tar.xz
cd texinfo-7.0.2

./configure --prefix=/usr

make

make install

cd ..
rm -rf texinfo-7.0.2
```

### 3.12. Util-linux-2.38.1

```bash
mkdir -pv /var/lib/hwclock

tar -xf util-linux-2.38.1.tar.xz
cd util-linux-2.38.1

./configure ADJTIME_PATH=/var/lib/hwclock/adjtime \
 --libdir=/usr/lib \
 --docdir=/usr/share/doc/util-linux-2.38.1 \
 --disable-chfn-chsh \
 --disable-login \
 --disable-nologin \
 --disable-su \
 --disable-setpriv \
 --disable-runuser \
 --disable-pylibmount \
 --disable-static \
 --without-python \
 runstatedir=/run
 
make

make install

cd ..
rm -rf util-linux-2.38.1
```

### 3.13. 清理和备份临时系统

```bash
rm -rf /usr/share/{info,man,doc}/*

find /usr/{lib,libexec} -name \*.la -delete3

rm -rf /tools
exit
```

终于可以退出chroot啦

接下来以root身份进行备份

```bash
mountpoint -q $LFS/dev/shm && umount $LFS/dev/shm
umount $LFS/dev/pts
umount $LFS/{sys,proc,run,dev}

cd $LFS
tar -cJpf $HOME/lfs-temp-tools-11.3-systemd.tar.xz .
```

时间有点久

如果要还原，可以进行以下操作，这里写个记录

```bash
cd $LFS
rm -rf ./*
tar -xpf $HOME/lfs-temp-tools-11.3-systemd.tar.xz
```

## 4. 构建LFS系统

终于，到了激动人心的构建LFS环节。

此前，只在临时工具的构建中出现过些许问题，Python和Util-linux。应该影响不大。

~~啊哦，因为某些事情，我耽搁了几天，导致我把之前的忘的差不多了，重新翻阅文档后，~~在7.4中提示，第七章和后续各章中的命令都要在chroot环境中进行，所以在这里我们备份后，以root的身份要重新进入chroot环境。

```bash
su -
chroot "$LFS" /usr/bin/env -i \
 HOME=/root \
 TERM="$TERM" \
 PS1='(lfs chroot) \u:\w\$ ' \
 PATH=/usr/bin:/usr/sbin \
 /bin/bash --login
```

```bash
cd sources
```

### 4.1. Man-pages 6.03

```bash
tar -xvf man-pages-6.03.tar.xz
cd man-pages-6.03

make prefix=/usr install

cd ..
rm -rf man-pages-6.03
```

### 4.2. Iana-Etc 20230202

```
tar -xvf iana-etc-20230202.tar.gz
cd iana-etc-20230202

cp services protocols /etc

cd ..
rm -rf iana-etc-20230202
```

### 4.3. Glibc 2.37

```bash
tar -xvf glibc-2.37.tar.xz
cd glibc-2.37

patch -Np1 -i ../glibc-2.37-fhs-1.patch

sed '/width -=/s/workend - string/number_length/' \
 -i stdio-common/vfprintf-process-arg.c
 
mkdir -v build
cd build

echo "rootsbindir=/usr/sbin" > configparms

../configure --prefix=/usr \
 --disable-werror \
 --enable-kernel=3.2 \
 --enable-stack-protector=strong \
 --with-headers=/usr/include \
 libc_cv_slibdir=/usr/lib
 
make -j8
```

出现error，`/dev/null:1:8: error: unknown type name 'GNU'`，尝试去官网找解决方案，找来找去找不到，限于英文水平不行，直接重来一遍！
