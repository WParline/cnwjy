---
title: CMU14445-2021-FALL DATABASE SYSTEMS NOTES
pubDate: 2022-10-02T03:28:33.000Z
tags: [C++, 数据库系统]
category: C++学习
coverImage: "/img/CMU14445-2021-FALL-DATABASE-SYSTEMS-NOTES.jpg"
---

# CMU14445/645

## Project #0 - C++ Primer

本项目需要实现一组简单的矩阵运算类，包含矩阵加法、乘法、通用矩阵乘法，以检验实验者的C++编程能力，并帮助学习者熟悉本课程的项目配置以及提交流程

### class Matrix

矩阵基类，含行数列数以及指针成员**linear_**  
因为其设置Matrix为模板类，故这是一个可以接受任意类型数据的矩阵  
linear本身为线性的意思，故我们给**linear_**new一个线性数组进行初始化
这样一个基本的，有行数，有列数，有存储数据的数组（动态生成的）的矩阵就构造好了

```C++
Matrix(int rows, int cols)
{
    rows_ = rows;
    cols_ = cols;
    linear_ = new T[rows * cols + 1];
}
```

除此之外矩阵基类还含有GetRowCount、GetColumnCount、GetElement、SetElement、FillFrom这几个虚函数，不作实现要求  

既然构造函数对**linear_**进行了动态生成，那么在析构函数里就需要进行释放

```C++
virtual ~Matrix() { delete[] linear_; }
```

### class RowMatrix

行矩阵类公有继承自Matrix  
使用一个二级指针**data_**来指向**linear_**，以获取数据
> tips: 构造函数后加冒号是初始化表达式

```C++
RowMatrix(int rows, int cols) : Matrix<T>(rows, cols)
{
    data_ = new T *[rows];
    for (int i = 0; i < rows; i++)
    {
        data_[i] = &this->linear_[i * cols];
    }
}
```

获取行数和列数很简单，直接return即可

```C++
int GetRowCount() const override { return this->rows_; }
int GetColumnCount() const override { return this->cols_; }
```

获取和设置元素值需要有坐标，而坐标有可能会出现越界情况，如果下标越界需要抛出**OUT_OF_RANGE**错误  
> tips: OUT_OF_RANGE 是标准异常之一，位于Stdexcept库，始于C++11

```C++
T GetElement(int i, int j) const override
{
    if(i<0 || j<0 || i>=this->rows_ || j>= this->cols_)
    {
        throw Exception(ExceptionType::OUT_OF_RANGE, "RowMatrix::GetElement(i, j) out of range.");
    }
    return data_[i][j];
}

void SetElement(int i, int j, T val) override
{
    if(i<0 || j<0 || i>=this->rows_ || j>= this->cols_)
    {
        throw Exception(ExceptionType::OUT_OF_RANGE, "RowMatrix::SetElement(i, j, val) out of range.");
    }
    data_[i][j] = val;
  }
```

矩阵基类还需要实现一个从容器中获取数据对矩阵进行填充的函数
> tips: Vector.size() 返回的是无符号整数

```C++
void FillFrom(const std::vector<T> &source) override
{
    int size = static_cast<int>(source.size());
    if (size != this->rows_ * this->cols_)
    {
        throw Exception(ExceptionType::OUT_OF_RANGE, "RowMatrix::FillFrom(source) out of range.");
    }
    for (int i = 0; i < size; i++)
    {
        this->linear_[i] = source[i];
    }
}
```

最后，析构函数必不可少

```C++
~RowMatrix() override { delete[] data_; }
```

### class RowMatrixOperations

行矩阵操作类，需要实现加法、乘法和一般矩阵乘法（第一次接触这个）  
我们知道两个矩阵相加的前提条件是行数列数都相同  
同时也知道相乘需要第一个矩阵的列数column和第二个矩阵的行数row相同才能进行  
而一般矩阵乘法（通用矩阵乘法）在这里要求的是**matrixA * matrixB + matrixC**， 也就意味着矩阵A的行数与矩阵B的列数分别对应矩阵C的行列
> tips: unique_ptr是智能指针，当被定义时所处的局部作用域失效时，自动释放内存

```C++
static std::unique_ptr<RowMatrix<T>> Add(const RowMatrix<T> *matrixA, const RowMatrix<T> *matrixB)
{
    int left;
    int right;
    int rows = matrixA->GetRowCount();
    int cols = matrixB->GetColumnCount();
    if (rows != matrixB->GetRowCount() || matrixA->GetColumnCount() != cols)
    {
        return std::unique_ptr<RowMatrix<T>>(nullptr);
    }
    std::unique_ptr<RowMatrix<T>> res(new RowMatrix<T>(rows, cols));
    for (int i = 0; i < rows; i++)
    {
        for (int j = 0; j < cols; j++)
        {
            left = matrixA->GetElement(i, j);
            right = matrixB->GetElement(i, j);
            res->SetElement(i, j, left + right);
        }
    }
    return res;
}

static std::unique_ptr<RowMatrix<T>> Multiply(const RowMatrix<T> *matrixA, const RowMatrix<T> *matrixB)
{
    int left;
    int right;
    int rows = matrixA->GetRowCount();
    int cols = matrixB->GetColumnCount();
    if (matrixA->GetColumnCount() != matrixB->GetRowCount())
    {
        return std::unique_ptr<RowMatrix<T>>(nullptr);
    }
    T element;
    int temp = matrixA->GetColumnCount();
    std::unique_ptr<RowMatrix<T>> res(new RowMatrix<T>(rows, cols));
    for (int i = 0; i < rows; i++)
    {
        for (int j = 0; j < cols; j++)
        {
            element = 0;
            for (int k = 0; k < temp; k++)
            {
                left = matrixA->GetElement(i, k);
                right = matrixB->GetElement(k, j);
                element += left * right;
            }
            res->SetElement(i, j, element);
        }
    }
    return res;
}

static std::unique_ptr<RowMatrix<T>> GEMM(const RowMatrix<T> *matrixA, const RowMatrix<T> *matrixB, const RowMatrix<T> *matrixC)
{
    int left;
    int right;
    int rows = matrixA->GetRowCount();
    int cols = matrixB->GetColumnCount();
    if (rows != matrixC->GetRowCount() || cols != matrixC->GetColumnCount())
    {
        return std::unique_ptr<RowMatrix<T>>(nullptr);
    }
    T element;
    int temp = matrixA->GetColumnCount();
    std::unique_ptr<RowMatrix<T>> res(new RowMatrix<T>(rows, cols));
    for (int i = 0; i < rows; i++)
    {
        for (int j = 0; j < cols; j++)
        {
            element = matrixC->GetElement(i, j);
            for (int k = 0; k < temp; k++)
            {
                left = matrixA->GetElement(i, k);
                right = matrixB->GetElement(k, j);
                element += left * right;
            }
            res->SetElement(i, j, element);
        }
    }
    return res;
}
```

### Test and Format

build目录下  
用 **make starter_test** 和 **./test/start_test** 进行测试，需要去除test目录下相应的cpp文件中函数参数中的 **disable** 前缀  
用 **make format** 和 **make check-lint** 还有 **make check-clang-tidy** 进行格式检查  
**check-clang-tidy** 比较慢，可以不做，上传测试网站后可以复制错误报告查看错误详情  
一般本地测试过了代码就没啥问题了，有问题都是因为格式问题  

## Project #1 - Buffer Pool

本项目需要实现缓冲池，缓冲池负责将物理页面从磁盘中读入内存、或从内存中写回磁盘，使得DBMS可以支持大于内存大小的存储容量，值得注意的是，缓冲池应当是用户透明且线程安全的

### Task #1 - LRU Replacement Policy

这部分需要实现缓冲池中的**LRUReplacer**，该组件的功能是跟踪缓冲池内的页面的使用情况，并在缓冲池容量不足时驱除缓冲池中最近较少使用的页面，需要实现四个接口（函数），它们分别是**Victim(frame_id_t *)**、**Pin(frame_id_t)**、**Unpin(frame_id_t)**、**Size()**

为了配合这四个函数，需要用**list**记录页面被访问的先后顺序，用**unordered_map**实现存储<页面ID - 链表节点(list)>键值对，这样子可以方便查找删除，可以以O(1)的复杂度删除list元素

```c++
std::unordered_map<frame_id_t, std::list<frame_id_t>::iterator> data_idx_;
std::list<frame_id_t> data_;
std::mutex data_latch_;
```

**Victim**函数需要实现的功能是，驱除缓冲池中最近很少使用的页面，并将其内容存储在输入参数中，当LRUReplacer为空时返回**False**，否则返回**True**  

使用data_latch_.lock()是为了实现线程安全，整个函数应当由**mutex**互斥锁保护

```C++
bool LRUReplacer::Victim(frame_id_t *frame_id) {
  data_latch_.lock();
  if (data_idx_.empty()) {
    data_latch_.unlock();
    return false;
  }
  *frame_id = data_.front();
  data_.pop_front();
  data_idx_.erase(*frame_id);
  data_latch_.unlock();
  return true;
}
```

**Pin**函数需要实现的功能是，检查**LRUReplace**中是否存在对应页面ID的节点，不存在直接返回，如果存在则删除(意味着需要使用该页面，不需要存储在缓冲池里了)，为了删除得更快，前面设计的**unordered_map**就派上用场了

```C++
void LRUReplacer::Pin(frame_id_t frame_id) {
  data_latch_.lock();
  auto it = data_idx_.find(frame_id);
  if (it != data_idx_.end()) {
    data_.erase(it->second);
    data_idx_.erase(it);
  }
  data_latch_.unlock();
}
```

**Unpin**函数需要实现的功能与Pin相反

> tips: prev函数功能为返回[参数]前一个

```C++
void LRUReplacer::Unpin(frame_id_t frame_id) {
  data_latch_.lock();
  auto it = data_idx_.find(frame_id);
  if (it == data_idx_.end()) {
    data_.push_back(frame_id);
    data_idx_[frame_id] = prev(data_.end());
  }
  data_latch_.unlock();
}
```

Size函数很简单，返回当前页面数量即可，可以使用list大小或者unorderred_map大小

```C++
size_t LRUReplacer::Size() {
  data_latch_.lock();
  size_t res = data_.size();
  data_latch_.unlock();
  return res;
}
```

### Task #2 - Buffer Pool Manager Instance

学到这里我就开始考虑，它们是怎么串起来的 ，给我的整体感觉就是，每一部分功能代码都是通过关键内容的各项属性进行操作，比如就是说我只记录页面的ID和其他啥的，接口（函数）本身不对关键内容进行修改，只是对信息进行操作，最后返回一定的反馈，其他接口（函数）可以根据反馈做事，就好比如管理学生，我知道学生们的成绩，对成绩进行排序，根据排序结果告诉老师，该给谁好的评价

这个任务需要实现缓冲池管理模块，那怎么管理呢，我是这样理解的，它从磁盘中获取页面（数据库页面），在特定的时候（比如被强制要求或者驱逐页面时将页面写回磁盘）  

那么为了模块化管理，需要加一个DiskManger（这是这个课程的设计），我是这么认为的，而这个函数就提供一些函数（或者说接口）来给你读入和写回

它的成员设计如下

```C++
Page *pages_;

DiskManager *disk_manager_ __attribute__((__unused__));

LogManager *log_manager_ __attribute__((__unused__));

std::unordered_map<page_id_t, frame_id_t> page_table_;

Replacer *replacer_;

std::list<frame_id_t> free_list_;

std::mutex latch_;
```

**Page**用来存放页面，供DBMS访问；**DiskManger**为磁盘管理器，提供读入页面和写回页面的函数（接口）；LogManger这里用不到；**Replacer**即是我们上面实现的**LRUReplace**；用**list**来保存缓冲池中的空闲槽位ID  

它们的内部成员和具体实现都可以翻看课程代码  

通过它写好构造函数代码可以看到，任务是一环扣一环的，缓冲池的大小都是预先设定好的  

```C++
pages_ = new Page[pool_size_];
replacer_ = new LRUReplacer(pool_size);

// Initially, every page is in the free list.
for (size_t i = 0; i < pool_size_; ++i) {
    free_list_.emplace_back(static_cast<int>(i));
}
```

**FlushPgImp**函数需要做的事是显式地将缓冲池页面写回磁盘。具体逻辑是，首先，应当检查缓冲池中是否存在对应页面ID的页面，不存在返回false，存在则将缓冲池内的该页面is_dirty属性设置为false，并使用DiskManger提供的WritePage函数将页面的实际数据写回磁盘，使用互斥锁保证线程安全  

> qs: 什么才算是dirty呢？

```C++
/**
 * Flushes the target page to disk.
 * @param page_id id of page to be flushed, cannot be INVALID_PAGE_ID
 * @return false if the page could not be found in the page table, true otherwise
 */
 
bool BufferPoolManagerInstance::FlushPgImp(page_id_t page_id) {
  frame_id_t frame_id;
  latch_.lock();
  if (page_table_.count(page_id) == 0U) {
    latch_.unlock();
    return false;
  }

  frame_id = page_table_[page_id];
  pages_[frame_id].is_dirty_ = false;
  disk_manager_->WritePage(page_id, pages_[frame_id].GetData());
  latch_.unlock();
  return true;
}
```

**FlushAllPgsImp**函数就是将操作单个变成操作全部

```C++

void BufferPoolManagerInstance::FlushAllPgsImp() {
  latch_.lock();
  for (auto [page_id, frame_id] : page_table_) {
    pages_[frame_id].is_dirty_ = false;
    disk_manager_->WritePage(page_id, pages_[frame_id].GetData());
  }
  latch_.unlock();
}
```

**NewPgImp**函数大体需要做的事是新建一个页面并存到缓冲池中，把页面ID存到输入参数中，返回指向新页面的指针，而具体的步骤如下

1. 首先判断缓冲池大小是否还能允许增加页面（也就是槽位数量还够不够），够的话直接取出一个槽位ID就可以了
2. 不够的话，就需要通过先前实现的**Victim**函数驱逐最近很少使用的页面，获取对应的槽位ID
3. 如果当前装不下新页面，且当前所有缓冲池里面的页面都在被使用中，那么无法做到新建页面存入缓冲池中，返回false
4. 通过已经给定的写好的**AllocatePage**函数在磁盘里面申请物理页面，会返回一个页面ID
5. 之前已经获取的槽位ID，刚刚也得到了页面ID，现在就要把页面放到对应的槽位上，在放置之前，需要确定槽位之前的页面是否是脏页面，如果是的话，需要先写回磁盘，把脏属性改为false
6. 最后就是存入page_table_了，先把之前的<槽位 - 旧页面>信息剔除掉，然后增加<槽位 - 新页面>信息，重置内容等，返回指向页面的指针

```C++
Page *BufferPoolManagerInstance::NewPgImp(page_id_t *page_id) {
  frame_id_t new_frame_id;
  latch_.lock();
  if (!free_list_.empty()) {
    new_frame_id = free_list_.front();
    free_list_.pop_front();
  } else if (!replacer_->Victim(&new_frame_id)) {
    latch_.unlock();
    return nullptr;
  }

  *page_id = AllocatePage();

  if (pages_[new_frame_id].IsDirty()) {
    page_id_t flush_page_id = pages_[new_frame_id].page_id_;
    disk_manager_->WritePage(flush_page_id, pages_[new_frame_id].GetData());
    pages_[new_frame_id].is_dirty_ = false;
  }

  page_table_.erase(pages_[new_frame_id].GetPageId());
  page_table_[*page_id] = new_frame_id;
  pages_[new_frame_id].page_id_ = *page_id;
  pages_[new_frame_id].ResetMemory();
  pages_[new_frame_id].pin_count_ = 1;
  replacer_->Pin(new_frame_id);

  latch_.unlock();

  return &pages_[new_frame_id];
}
```

**FetchPgImp**函数需要做的事是从缓冲池中获取需要的页面，返回指向页面的指针，具体逻辑如下

1. 在page_table_中检查是否有需要的页面，有的话返回，用户数等细节要处理
2. 如果缓冲池中没有，就要从磁盘中获取，获取了要放到对应的槽位，具体操作同NewPgImp函数

```C++
Page *BufferPoolManagerInstance::FetchPgImp(page_id_t page_id) {
  frame_id_t frame_id;
  latch_.lock();
  if (page_table_.count(page_id) != 0U) {
    frame_id = page_table_[page_id];
    pages_[frame_id].pin_count_++;
    replacer_->Pin(frame_id);
    latch_.unlock();
    return &pages_[frame_id];
  }

  if (!free_list_.empty()) {
    frame_id = free_list_.front();
    free_list_.pop_front();
    page_table_[page_id] = frame_id;
    disk_manager_->ReadPage(page_id, pages_[frame_id].data_);
    pages_[frame_id].pin_count_ = 1;
    pages_[frame_id].page_id_ = page_id;
    replacer_->Pin(frame_id);
    latch_.unlock();
    return &pages_[frame_id];
  }

  if (!replacer_->Victim(&frame_id)) {
    latch_.unlock();
    return nullptr;
  }

  if (pages_[frame_id].IsDirty()) {
    page_id_t flush_page_id = pages_[frame_id].GetPageId();
    disk_manager_->WritePage(flush_page_id, pages_[frame_id].GetData());
    pages_[frame_id].is_dirty_ = false;
  }

  page_table_.erase(pages_[frame_id].GetPageId());
  page_table_[page_id] = frame_id;
  pages_[frame_id].page_id_ = page_id;
  disk_manager_->ReadPage(page_id, pages_[frame_id].data_);
  pages_[frame_id].pin_count_ = 1;
  replacer_->Pin(frame_id);
  latch_.unlock();

  return &pages_[frame_id];
}
```

**DeletePgImp**函数需要做的是删除缓冲池中对应的page_id，具体逻辑如下：

1. 首先按照课程注释要求调用DeallocatePage（实际上此时是一个空函数，如果要通过实验1的测试，不调用也没影响）
2. 如果page_id不存在当前缓冲池中，理所当然不需要删除，直接返回true
3. 如果page_id存在，但是正被用户使用，也不能删除
4. 如果page_id对应的页面是脏页面，要先写回磁盘
5. 最后在**page_table_**和**pages_**删除，并在**free_list_**中添加，返回true

```C++
bool BufferPoolManagerInstance::DeletePgImp(page_id_t page_id) {
  latch_.lock();
  if (page_table_.count(page_id) == 0U) {
    latch_.unlock();
    return true;
  }

  frame_id_t frame_id;
  frame_id = page_table_[page_id];
  if (pages_[frame_id].pin_count_ != 0) {
    latch_.unlock();
    return false;
  }

  if (pages_[frame_id].IsDirty()) {
    page_id_t flush_page_id = pages_[frame_id].GetPageId();
    disk_manager_->WritePage(flush_page_id, pages_[frame_id].GetData());
    pages_[frame_id].is_dirty_ = false;
  }

  page_table_.erase(page_id);
  pages_[frame_id].page_id_ = INVALID_PAGE_ID;
  free_list_.push_back(frame_id);
  latch_.unlock();

  return true;
}
```

**UnpinPgImp**函数需要做的是就是unpin，处理一些极端情况即可，具体逻辑如下

1. 注意unpin的过程中页面is_dirty属性的变化，使用或等于
2. 如果没有人pin，那就不需要unpin，返回false
3. 如果刚好unpin之后，没人了，贴心的把页面放回缓冲池中

```C++
bool BufferPoolManagerInstance::UnpinPgImp(page_id_t page_id, bool is_dirty) {
  latch_.lock();
  frame_id_t frame_id;
  if (page_table_.count(page_id) != 0U) {
    frame_id = page_table_[page_id];
    pages_[frame_id].is_dirty_ |= is_dirty;
    if (pages_[frame_id].pin_count_ <= 0) {
      latch_.unlock();
      return false;
    }

    if (--pages_[frame_id].pin_count_ == 0) {
      replacer_->Unpin(frame_id);
    }
  }
  latch_.unlock();

  return true;
}
```

写到这里，我对lru_replacer和buffer_pool_manager_instance的作用又有了新理解  

lru_replacert提供了替换策略并记录了是否在缓冲池的情况  

buffer_pool_manager_instance提供了对页面的操作并记录了页面的情况  

### Task #3 - Parallel Buffer Pool Manager

显而易见的，以上实现的所有函数都加锁了，也就是锁的粒度很大，其在进行任何一项操作时都将整个缓冲池锁住，因此几乎不存在并行性，本任务并行缓冲池的思想是分配多个独立的缓冲池，并将不同的页面ID映射至各自的缓冲池中，从而减少整体缓冲池的锁粒度，增加并行性  

首先，我们先观察一下已经设计好的类成员，**instances_**用于存储多个独立的缓冲池（Vector容器），**pool_size_**记录各缓冲池的容量，**num_instances_**为独立缓冲池的个数，**start_idx_**是用来参与负载均衡的，后面会讲到  

**构造函数和析构函数**需要实现的是建立多个缓冲池和删除多个缓冲池（各独立缓冲池在堆区中进行分配，最后释放）

```C++
ParallelBufferPoolManager::ParallelBufferPoolManager(size_t num_instances, size_t pool_size, DiskManager *disk_manager, LogManager *log_manager) {
  // Allocate and create individual BufferPoolManagerInstances
  num_instances_ = num_instances;
  pool_size_ = pool_size;
  for (size_t i = 0; i < num_instances; i++) {
    BufferPoolManager *temp = new BufferPoolManagerInstance(pool_size, num_instances, i, disk_manager, log_manager);
    instances_.push_back(temp);
  }
}

ParallelBufferPoolManager::~ParallelBufferPoolManager() {
  for (size_t i = 0; i < num_instances_; i++) {
    delete (instances_[i]);
  }
}
```

**GetPoolSize**函数返回全部缓冲池的总容量，即独立缓冲池个数乘以缓冲池容量

```C++
size_t ParallelBufferPoolManager::GetPoolSize() {
  // Get size of all BufferPoolManagerInstances
  return num_instances_*pool_size_;
}
```

**GetBufferPoolManager**函数返回页面对应的缓冲池，这里通过取余的方式，根据取余结果决定page_id存放在哪个缓冲池

```C++
BufferPoolManager *ParallelBufferPoolManager::GetBufferPoolManager(page_id_t page_id) {
  // Get BufferPoolManager responsible for handling given page id. You can use this method in your other methods.
  return instances_[page_id % num_instances_];
}
```

**NewPgImp**函数需要被特别注意，为了实现避免单个缓冲池累死累活其他缓冲池空空如也，也就是要负载均衡，需要采用轮转方法选取缓冲池进行分配物理页面，具体逻辑如下

1. 从**start_idx_**开始遍历各独立缓冲池，如存在调用**NewPage**函数成功的情况，则返回通过**NewPage**函数得到的页面（Page指针），并将**start_idx_**指向该页面对应ID的下一个ID
2. 如全部缓冲池调用**NewPage**函数都失败，返回空指针，递增**start_idx_**（暂时没搞懂全都失败了递增有啥用）

第一点中**start_idx_**递增可以实现多个缓冲池跟页面可以通过取余相对应

```C++
Page *ParallelBufferPoolManager::NewPgImp(page_id_t *page_id) {
  // create new page. We will request page allocation in a round robin manner from the underlying
  // BufferPoolManagerInstances
  // 1.   From a starting index of the BPMIs, call NewPageImpl until either 1) success and return 2) looped around to
  // starting index and return nullptr
  // 2.   Bump the starting index (mod number of instances) to start search at a different BPMI each time this function
  // is called
  Page *res;
  for (size_t i = 0; i < num_instances_; i++) {
    size_t index = (start_idx_ + i) % num_instances_;
    if ((res = instances_[index]->NewPage(page_id)) != nullptr) {
      start_idx_ = (*page_id + 1) % num_instances_;
      return res;
    }
  }
  start_idx_++;
  return nullptr;
}
```

其他函数大同小异，都是调用，注意调用的方式

```C++
Page *ParallelBufferPoolManager::FetchPgImp(page_id_t page_id) {
  // Fetch page for page_id from responsible BufferPoolManagerInstance
  BufferPoolManager *instance = GetBufferPoolManager(page_id);
  return instance->FetchPage(page_id);
}

bool ParallelBufferPoolManager::UnpinPgImp(page_id_t page_id, bool is_dirty) {
  // Unpin page_id from responsible BufferPoolManagerInstance
  BufferPoolManager *instance = GetBufferPoolManager(page_id);
  return instance->UnpinPage(page_id, is_dirty);
}

bool ParallelBufferPoolManager::FlushPgImp(page_id_t page_id) {
  // Flush page_id from responsible BufferPoolManagerInstance
  BufferPoolManager *instance = GetBufferPoolManager(page_id);
  return instance->FlushPage(page_id);
}

bool ParallelBufferPoolManager::DeletePgImp(page_id_t page_id) {
  // Delete page_id from responsible BufferPoolManagerInstance
  BufferPoolManager *instance = GetBufferPoolManager(page_id);
  return instance->DeletePage(page_id);
}

void ParallelBufferPoolManager::FlushAllPgsImp() {
  for (size_t i = 0; i < num_instances_; i++) {
    instances_[i]->FlushAllPages();
  }
}
```

