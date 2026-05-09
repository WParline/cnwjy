---
title: 高版本Ubuntu(22.04/20.04)安装ORB-SLAM2并试运行
pubDate: 2022-09-01T06:39:41.000Z
tags: [ORB-SLAM2, Ubuntu]
category: 视觉SLAM
coverImage: "/img/高版本Ubuntu(22.04 20.04)安装ORB-SLAM2并试运行.jpg"
---

## ubuntu 20.04 篇
1. install Pangolin, not follow the github guild, follow me
   1. sudo apt install libgl1-mesa-dev
   2. sudo apt install libglew-dev
   3. sudo apt install cmake
   4. [download Pangolin](Pangolin-master.zip) and cd Pangolin
   5. mkdir build && cd build
   6. sudo apt install libeigen3-dev
   7. cmake ..
   8. cmake --build .
   9. sudo make install
2. install opencv-3.4.6
   1. sudo apt install build-essential
   2. sudo apt install libgtk2.0-dev
   3. sudo apt install libavcodec-dev
   4. sudo apt install libavformat-dev 
   5. sudo apt install libjpeg.dev (maybe libjpef-dev also working)
   6. [download opencv-3.4.6 source](https://github.com/opencv/opencv/archive/3.4.6.zip)
   7. cd opencv
   8. mkdir build && cd build
   9. cmake ..
   10. make -j8 (so many warnings, but no error)
   11. sudo make install
3. build ORB-SLAM2 (https://github.com/raulmur/ORB_SLAM2)
   1. git clone https://github.com/raulmur/ORB_SLAM2.git ORB_SLAM2
   2. sudo apt install libcanberra-gtk-module
   3. cd ORB_SLAM2/
   4. chmod +x build.sh
   5. sed -i 's/++11/++14/g' CMakeLists.txt
   6. add **add_definitions(-w)** to CMakeLists.txt
   7. change **find_package(Eigen3 3.1.0 REQUIRED)** to **find_package(Eigen3 3.1.0 REQUIRED NO_MODULE)**
   8. add #include <unistd.h> to LoopClosing.h
   9. edit LoopClosing.h
      ```C++
      typedef map<KeyFrame*,g2o::Sim3,std::less<KeyFrame*>,Eigen::aligned_allocator<std::pair<const KeyFrame*, g2o::Sim3> > > KeyFrameAndPose;
      ```
      change to
      ```C++
      typedef map<KeyFrame*,g2o::Sim3,std::less<KeyFrame*>,Eigen::aligned_allocator<std::pair<KeyFrame *const, g2o::Sim3> > > KeyFrameAndPose;
      ```
   10. ./build.sh
4. run ORB-SLAM2
   1. sudo ldconfig
   2. ./Examples/Monocular/mono_tum Vocabulary/ORBvoc.txt Examples/Monocular/TUM1.yaml /home/conan/slam2/datasets/rgbd_dataset_freiburg1_desk
   3. install anaconda
   4. create py27 env
   5. activate py27 and pip install numpy
   6. download associate.py and move to datasets, cd datasets path
   7. python associate.py rgb.txt depth.txt > associations.txt
   8. ./Examples/RGB-D/rgbd_tum Vocabulary/ORBvoc.txt Examples/RGB-D/TUM1.yaml /home/conan/slam2/datasets/rgbd_dataset_freiburg1_desk /home/conan/slam2/datasets/rgbd_dataset_freiburg1_desk/associations.txt


## Ubuntu 22.04 篇
1. install Pangolin, not follow the github guild, follow me
   1. sudo apt install libgl1-mesa-dev
   2. sudo apt install libglew-dev
   3. sudo apt install cmake
   4. [download Pangolin](Pangolin-master.zip) and cd Pangolin
   5. mkdir build && cd build
   6. [manual install eigen3(3.3.7)](https://blog.csdn.net/reasonyuanrobot/article/details/114372363), do not use the apt to install eigen3 (like: apt install libeigen3-dev, in 22.04, the version of eigen is 3.4.0, does not fit for plangolin)
   7. cmake ..
   8. cmake --build .
   9. sudo make install
2. install opencv-3.4.6
   1. sudo apt install build-essential
   2. sudo apt install libgtk2.0-dev
   3. sudo apt install libavcodec-dev
   4. sudo apt install libavformat-dev 
   5. sudo apt install libjpeg-dev
   6. [download opencv-3.4.6 source](https://github.com/opencv/opencv/archive/3.4.6.zip)
   7. cd opencv
   8. mkdir build && cd build
   9. cmake ..
   10. make sure [change the gcc version to 9](https://blog.csdn.net/leon_zeng0/article/details/106957510), ubuntu 22.04 default gcc version is 11
   11. make -j8 (so many warnings, but no error)
   12. sudo make install
3. build ORB-SLAM2 (https://github.com/raulmur/ORB_SLAM2)
   1. git clone https://github.com/raulmur/ORB_SLAM2.git ORB_SLAM2
   2. sudo apt install libcanberra-gtk-module
   3. cd ORB_SLAM2/
   4. chmod +x build.sh
   5. sed -i 's/++11/++14/g' CMakeLists.txt
   6. add **add_definitions(-w)** to CMakeLists.txt
   7. change **find_package(Eigen3 3.1.0 REQUIRED)** to **find_package(Eigen3 3.1.0 REQUIRED NO_MODULE)**
   8. add #include <unistd.h> to LoopClosing.h
   9. edit LoopClosing.h
      ```C++
      typedef map<KeyFrame*,g2o::Sim3,std::less<KeyFrame*>,Eigen::aligned_allocator<std::pair<const KeyFrame*, g2o::Sim3> > > KeyFrameAndPose;
      ```
      change to
      ```C++
      typedef map<KeyFrame*,g2o::Sim3,std::less<KeyFrame*>,Eigen::aligned_allocator<std::pair<KeyFrame *const, g2o::Sim3> > > KeyFrameAndPose;
      ```
   10. ./build.sh
4. run ORB-SLAM2
   1. sudo ldconfig
   2. ./Examples/Monocular/mono_tum Vocabulary/ORBvoc.txt Examples/Monocular/TUM1.yaml /home/conan/slam2/datasets/rgbd_dataset_freiburg1_desk
   3. install anaconda
   4. create py27 env
   5. activate py27 and pip install numpy
   6. download associate.py and move to datasets, cd datasets path
   7. python associate.py rgb.txt depth.txt > associations.txt
   8. ./Examples/RGB-D/rgbd_tum Vocabulary/ORBvoc.txt Examples/RGB-D/TUM1.yaml /home/conan/slam2/datasets/rgbd_dataset_freiburg1_desk /home/conan/slam2/datasets/rgbd_dataset_freiburg1_desk/associations.txt