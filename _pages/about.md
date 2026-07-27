---
permalink: /
title: "Liu Wei / 刘威"
author_profile: true
hide_title: true
redirect_from:
  - /about/
  - /about.html
---

<section class="lw-hero">
  <div>
    <p class="lw-eyebrow">Tsinghua DSPLab · GPGPU Architecture · AI Infra</p>
    <h1 class="lw-title">刘威 / Wei Liu</h1>
    <p class="lw-subtitle">
      清华大学集成电路学院博士生，研究面向 AI 负载的 GPGPU 体系结构、Tensor Core 微架构、数值精度建模与软硬件协同优化。
      I build efficient GPU-style architectures and ML systems from numerical behavior to microarchitecture.
    </p>
    <div class="lw-tags">
      <span class="lw-tag">GPGPU Architecture</span>
      <span class="lw-tag">Tensor Core</span>
      <span class="lw-tag">MLSys</span>
      <span class="lw-tag">Hardware/Software Co-design</span>
    </div>
    <div class="lw-actions">
      <a class="lw-button" href="/cv/">View CV</a>
      <a class="lw-button lw-button--ghost" href="/publications/">Publications</a>
      <a class="lw-button lw-button--ghost" href="https://github.com/liuweibupt">GitHub</a>
    </div>
  </div>
  <figure class="lw-portrait-card">
    <img src="/images/liuwei-avatar.jpg" alt="Wei Liu public GitHub avatar">
    <figcaption class="lw-portrait-caption">From AI to MLSys &amp; Architecture</figcaption>
  </figure>
</section>

<div class="lw-stats">
  <div class="lw-stat"><strong>9+</strong><span>Tensor Core numeric formats</span></div>
  <div class="lw-stat"><strong>3.46×</strong><span>FP8 area efficiency gain</span></div>
  <div class="lw-stat"><strong>2.1×</strong><span>DriveLM end-to-end speedup</span></div>
  <div class="lw-stat"><strong>7</strong><span>Patents / patent applications</span></div>
</div>

<section class="lw-section">
  <h2 class="lw-section-title">Research Focus</h2>
  <div class="lw-card-grid">
    <article class="lw-card">
      <h3>乘影 RISC-V 开源 GPGPU</h3>
      <p>参与 Ventus GPGPU 体系结构设计空间探索，面向 AI 负载分析 Vector、Tensor、SFU、SRAM 与显存带宽之间的协同关系。</p>
    </article>
    <article class="lw-card">
      <h3>TensorForge</h3>
      <p>设计支持 TF32、BF16、FP16、INT8/4、FP8/6/4 与 Binary 的可复用多精度 Tensor Core，并探索 18 种复用策略。</p>
    </article>
    <article class="lw-card">
      <h3>TensorGauge</h3>
      <p>构建 CUDA 加速 bit-level Tensor Core 数值模型并接入 PyTorch，在预硅阶段量化微架构数值语义对训练/推理的影响。</p>
    </article>
    <article class="lw-card">
      <h3>MLSys Optimization</h3>
      <p>围绕 DriveLM 多模态视觉语言模型完成 AWQ/PTQ、LoRA 融合与 FP16 Tensor Core 加速，实现显存降低与推理加速。</p>
    </article>
  </div>
</section>

<section class="lw-section">
  <h2 class="lw-section-title">Selected Timeline</h2>
  <div class="lw-timeline">
    <div class="lw-timeline-item"><strong>2026 · ARITH</strong><span>TensorGauge accepted by IEEE Symposium on Computer Arithmetic.</span></div>
    <div class="lw-timeline-item"><strong>2026 · 芯原杯</strong><span>全国嵌入式大赛二等奖。</span></div>
    <div class="lw-timeline-item"><strong>2025 · IC Competition</strong><span>全国大学生集成电路创新创业大赛一等奖。</span></div>
    <div class="lw-timeline-item"><strong>2023—Now · Ventus GPGPU</strong><span>Core member of Tsinghua “乘影” RISC-V open-source GPGPU project.</span></div>
  </div>
</section>

<section class="lw-section">
  <h2 class="lw-section-title">Open Source</h2>
  <div class="lw-card-grid">
    <article class="lw-card lw-project-card">
      <h3><a href="https://github.com/liuweibupt/DLAFNet">DLAFNet</a></h3>
      <p>2D aerial image and 3D LiDAR point-cloud semantic segmentation.</p>
      <a class="lw-mini-link" href="https://github.com/liuweibupt/DLAFNet">GitHub →</a>
    </article>
    <article class="lw-card lw-project-card">
      <h3><a href="https://github.com/THU-DSP-LAB/ventus-gpgpu">ventus-gpgpu</a></h3>
      <p>清华“乘影” RISC-V 开源 GPGPU 项目。</p>
      <a class="lw-mini-link" href="https://github.com/THU-DSP-LAB/ventus-gpgpu">GitHub →</a>
    </article>
    <article class="lw-card lw-project-card">
      <h3><a href="https://github.com/THU-DSP-LAB/sfu">sfu</a></h3>
      <p>多精度特殊函数单元设计与实现。</p>
      <a class="lw-mini-link" href="https://github.com/THU-DSP-LAB/sfu">GitHub →</a>
    </article>
    <article class="lw-card lw-project-card">
      <h3><a href="/projects/">More Projects</a></h3>
      <p>Ventus OpenCL testcases、ventus-pytorch、TQP / GPU Tensor DB 等。</p>
      <a class="lw-mini-link" href="/projects/">Open Source Page →</a>
    </article>
  </div>
</section>

<section class="lw-section">
  <h2 class="lw-section-title">Selected Publications</h2>
  <div class="lw-card">
    <ul>
      <li><strong>TensorGauge</strong>: A pre-silicon end-to-end framework for quantifying numerical effects of Tensor Core microarchitecture in GEMM, ARITH 2026.</li>
      <li><strong>TensorForge</strong>: Systematic design space exploration of multi-precision Tensor Cores for GPGPUs, ICCAD under review.</li>
      <li><strong>RISC-V-Based GPGPU With Vector Capabilities for High-Performance Computing</strong>, IEEE TVLSI 2025.</li>
      <li><strong>DLAFNet</strong>: Direct LiDAR-aerial fusion for 2D/3D semantic segmentation, IGARSS 2023 Oral &amp; IEEE JSTARS 2024. <a href="https://github.com/liuweibupt/DLAFNet">Code</a></li>
      <li><strong>SeMask-Mask2Former</strong>, <strong>Semantic Memory Guided Image Representation</strong>, and <strong>ABCF</strong> are listed on the Publications page.</li>
    </ul>
  </div>
</section>
