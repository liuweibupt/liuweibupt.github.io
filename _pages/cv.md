---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

# 刘威

博士生｜GPGPU 体系结构｜Tensor Core 微架构｜AI Infrastructure / MLsys｜软硬件协同设计

电话：15233595728 ｜ 邮箱：[liuw24@mails.tsinghua.edu.cn](mailto:liuw24@mails.tsinghua.edu.cn) ｜ GitHub：[liuweibupt](https://github.com/liuweibupt) ｜ 北京

## 教育经历

### 清华大学｜集成电路学院 DSPLab｜电子信息 博士
- **时间地点**：2024.09—2029.06（预计）｜北京
- **导师**：何虎
- **研究方向**：面向人工智能负载的 GPGPU 体系结构、Tensor Core / SFU 微架构、AI infra 与软硬件协同优化。
- **GPA / 奖学金**：3.9 / 4.0｜综合一等奖学金（比亚迪奖学金）

相关课程：并行计算（4.0）、人工智能基础软硬件核心（4.0）、人工智能芯片算法硬件协同设计（4.0）、数字大规模集成电路（4.0）

### 北京邮电大学｜人工智能学院｜人工智能 本科
- **时间地点**：2020.09—2024.07｜北京
- **GPA / 项目**：3.78 / 4.0｜叶培大创新创业实验班（全校每届约 100 名）
- **荣誉**：北京市优秀毕业生、三好学生（3 次）、烽火通信奖学金、一等奖学金（专业前 3%，2 次）、优秀共青团员、企业爱心一等奖学金（2 次）

相关课程：C/C++ 程序设计（96）、Python 程序设计（94）、神经网络与深度学习（94）、模式识别与机器学习（96）

## 研究与项目经历

### 清华大学“乘影”RISC-V 开源 GPGPU｜核心成员
**2023.10—至今｜清华大学**

**GPGPU 体系结构设计空间探索**
- 面向 AI 负载，分析 GPGPU SIMT 架构中 Vector、Tensor、SFU、SRAM 等组件的资源配比与设计空间。
- 针对国内 HBM 显存带宽受限场景，基于仿真器评估 L3 Cache、LoRA 与 SVD 模型压缩等软硬件协同优化策略。
- 参与 Ventus GPGPU 体系结构迭代，相关工作发表于 IEEE TVLSI 2025，并在 2024/2025 RISC-V 中国峰会、MICRO 2025 Tutorial 等场合展示。

**多精度 Tensor Core 设计与优化（TensorForge）**
- 设计并实现支持 TF32、BF16、FP16、INT8、INT4、FP8、FP6、FP4、Binary 的多精度 GPGPU Tensor Core。
- 兼容 OCP MX 标准与 NVIDIA NVFP4，支持细粒度量化；设计张量乘法器复用架构，系统探索 18 种多精度复用策略。
- 定位面积/功耗 Pareto 最优与面积最小 Tensor Core 配置；集成至 Ventus GPGPU 后占 SM 面积 27.7%。
- 对比学术界 SOTA：FP8 面效提升 3.46×、能效提升 3.34×；FP4 面效提升 1.76×、能效提升 2.19×。
- FP16 矩阵乘指令周期优化 16×，寄存器读写次数减少 9.14×；典型 AI 算子中 Attention 提升 2.13×、Linear 提升 3.87×。
- 论文：W. Liu et al., *TensorForge: Systematic Design Space Exploration of Multi-Precision Tensor Cores for GPGPUs*, ICCAD under review.

**Tensor Core 数值精度建模（TensorGauge）**
- 面向 NVIDIA Hopper / Blackwell Tensor Core 低精度计算路径，构建 CUDA 加速的 bit-level Tensor Core 数值模型，并接入 PyTorch 训练/推理流程。
- 覆盖 dot-product reduction、rounding path、中间保留位宽等微架构语义，支持预硅阶段端到端评估 Tensor Core 数值行为对神经网络的影响。
- 发现仅使用算子级误差指标不足以指导硬件配置，模型级训练/推理对中间累加精度存在格式相关阈值。
- BERT 训练实验显示：FP8 中间位宽需 >21 bit；NVFP4 / MXFP4 中间位宽需 >28 bit，因此 FP4 共享硬件实现应按更高精度目标预留。
- 论文：W. Liu et al., [*TensorGauge: A Pre-silicon End-to-end Framework for Quantifying Numerical Effects of Tensor Core Microarchitecture in GEMM*](https://arith2026.org/papers/TensorGauge%21%20A%20Pre-silicon%20End-to-end%20Framework%20for%20Quantifying%20Numerical%20Effects%20of%20Tensor%20Core%20Mic.pdf), ARITH 2026. 技术笔记：[知乎专栏](https://zhuanlan.zhihu.com/p/2055039798231012182)。

**多精度 SFU 设计**
- 带领同学完成 FP32 / FP16 / BF16 复用的全流水多功能 SFU 设计，支持 exp2、log2、rcp、sqrt、rsqrt、sin、cos。
- 第三作者完成专利《一种多精度特殊函数单元设计》；相关成果获学院公众号报道。

### DriveLM 多模态视觉语言模型压缩优化｜负责人
**2025.03—2025.06｜清华大学**
- 负责自动驾驶多模态视觉语言模型量化压缩与性能调优，探索 GPTQ、AWQ、W4A16 PTQ 等方案。
- 基于 llm-awq 适配 Phi-4 架构并完成 AWQ 量化，显存降低超过 50%，速度提升 47.68%，性能损失约 7%。
- 实现 LoRA 融合与权重 FP16 转换，恢复 Tensor Core 加速；在保持精度不变的情况下推理速度提升 28%。
- 最终控制精度损耗 < 1%，综合模型加速超过 2.1×。

### 遥感图像 / 点云语义分割｜组长
**北京航空航天大学、北京邮电大学**
- 阅读 100 余篇计算机视觉与遥感语义分割论文，复现 10 余个二维/三维语义分割模型，包括 FCN、PSPNet、SegFormer、Swin Transformer、PointNet、PointNet++、KPConv。
- 围绕 2D 航空影像与 3D LiDAR 点云融合开展研究，完成论文 3 篇、专利 1 项、竞赛获奖 2 项。
- 代表成果：IGARSS 2023 Oral、IEEE Aerospace Conference 2023、IEEE JSTARS 2025。

## 实习经历

### 腾讯｜TEG 数据计算平台部｜青云计划实习生
**2026.05—2026.08｜深圳 / 北京**
- 面向 GPU / NPU 体系结构数据库负载开展 profiling，使用 Nsight Systems / Nsight Compute 进行性能分析。
- 复现并评估 SiriusDB，发现 NVIDIA cuDF bug 并提交 issue。
- 搭建 TQP，用于国产 GPU 数据库负载评估；支持寒武纪 MLU950、昆仑芯 P300。
- 指导 4 位清华本科生完成 TensorRecordBatch / Join 算子实践。

### 字节跳动｜AI 芯片实习生
- 使用 Triton 实现 GEMM benchmark，建模矩阵 tiling、tileN / tileK 与 GEMM pipeline 策略。
- 参与 mega-kernel 实现，熟悉自研 AI 芯片架构；理论分析 Tensor / Vector 资源比例。
- 使用 Ada-C 完成功耗测试，并开展 SRAM 带宽与 NoC 行为测试。

### 字节跳动 剪映｜算法实习生
- 参与用户价值预测模型、广告收益分析与用户行为数据分析。
- 优化作者收益分配策略，支持业务决策。

## 论文与学术成果

### Architecture / ML Systems
1. J. Li, F. Yu, M. Ma, **W. Liu**, Y. Wang, H. Wu and H. He, “RISC-V-Based GPGPU With Vector Capabilities for High-Performance Computing,” *IEEE Transactions on Very Large Scale Integration (VLSI) Systems*, 2025.
2. **W. Liu**, “A Multi-Precision Reusable Tensor Core Design,” MICRO 2025 Tutorial.
3. **W. Liu** et al., “TensorForge: Systematic Design Space Exploration of Multi-Precision Tensor Cores for GPGPUs,” ICCAD under review.
4. **W. Liu** et al., “TensorGauge: A Pre-silicon End-to-end Framework for Quantifying Numerical Effects of Tensor Core Microarchitecture in GEMM,” ARITH 2026.

### Remote Sensing / Computer Vision
1. **W. Liu**, H. Wang, Y. Qiao, B. Liang, J. Yang and H. Zhang, “DLAFNet: A Direct Fusion Method of 2D Aerial Image and 3D LiDAR Point Cloud for Semantic Segmentation,” IGARSS 2023 Oral Presentation.
2. Y. Qiao, **W. Liu**, B. Liang, P. Wang, H. Zhang and J. Yang, “SeMask-Mask2Former: A Semantic Segmentation Model for High Resolution Remote Sensing Images,” IEEE Aerospace Conference 2023.
3. **W. Liu**, H. Wang, Y. Qiao, H. Zhang and J. Yang, “DLAFNet: Direct LiDAR-Aerial Fusion Network for Semantic Segmentation of 2-D Aerial Image and 3-D LiDAR Point Cloud,” *IEEE Journal of Selected Topics in Applied Earth Observations and Remote Sensing*, 2025.

## 专利

1. 一种张量计算方法、装置、存储介质和计算机设备，申请号：202511814046.1，刘威、马鸣远、宋晓有、何虎。
2. 一种张量计算协处理器，申请号：202511404187.6。
3. 点积运算装置，申请号：202511287389.7。
4. 张量计算装置及通用图形处理器，申请号：202511350360.9。
5. 一种多精度特殊函数单元设计，申请号：202610681248.1。
6. 一种在有源中介层 TSV 邻近区域集成 SRAM 缓存的图形处理器封装系统及其访问方法。
7. 一种融合光学图像和激光雷达点云的遥感语义分割方法，申请号：202310312734.2。

## 荣誉奖项

- 全国大学生集成电路创新创业大赛一等奖（2025）
- 芯原杯全国嵌入式大赛二等奖（2026）
- 北京市优秀毕业生（2024）
- 华为 ICT 大赛全球总决赛二等奖（2023）
- 北邮-华为“智能基座”先锋青年奖（2021 / 2022）
- 中国大学生计算机设计大赛二等奖（2022）
- 全国大学生数学竞赛二等奖（2021）
- 全国大学生服务外包创新创业大赛二等奖（2023）

## 技能

- **编程与框架**：C/C++、Python、PyTorch、Chisel、CUDA、OpenCL、Triton。
- **体系结构与硬件**：GPGPU 编程模型与微架构、Tensor Core / SFU 设计、并行计算框架、性能建模与 profiling。
- **数据与建模**：机器学习、计算机视觉、数学建模、数据分析。
- **工具与写作**：LaTeX / Overleaf、英文论文写作、技术报告与项目提案。
- **语言**：英语 CET-6；联合国胜任力训练营，获 UNITAR 推荐信（Top 15%）。
- **兴趣**：爬山、骑行（<100 km / 次）、羽毛球、滑雪、书法、篆刻、电子琴（9 级）。
