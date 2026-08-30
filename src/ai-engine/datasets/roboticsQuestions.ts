import { Question } from '../../types';

export const ROBOTICS_QUESTION_DATASET: Question[] = [
  {
    id: 'q_rob_01',
    category: 'ROBOTICS_HARDWARE',
    roleCategory: 'Robotics Perception & Control Engineer',
    difficulty: 'HARD',
    title: 'Kinematics & Singularity Avoidance',
    prompt: 'Explain the mathematical difference between Forward Kinematics (FK) and Inverse Kinematics (IK) in a 6-DOF robotic manipulator. How do you detect and handle kinematic singularities in real-time trajectory execution?',
    expectedDurationSec: 120,
    idealBenchmarkAnswer: 'Forward kinematics uses Denavit-Hartenberg (DH) parameters or product of exponentials to compute end-effector Cartesian pose from joint angles using geometric transformation matrices. Inverse kinematics solves joint angles for a target pose, which is non-linear and may yield multiple or zero solutions. Singularities occur when the Jacobian matrix drops rank (determinant approaches zero), causing joint velocities to approach infinity. In real-time trajectory execution, we detect singularities by monitoring the condition number of the Jacobian or manipulability index. We mitigate them using Damped Least Squares (Levenberg-Marquardt regularization), null-space projection for redundant manipulators, or trajectory scaling to limit maximum joint velocity and prevent motor saturation.',
    keyConcepts: [
      'Forward Kinematics',
      'Inverse Kinematics',
      'Denavit-Hartenberg',
      'Jacobian Matrix',
      'Determinant Rank',
      'Damped Least Squares',
      'Null-space projection',
      'Manipulability index'
    ],
    antiPatterns: [
      'simply ignoring singularities',
      'forcing high motor torque without damping',
      'guessing joint angles randomly'
    ],
    rubric: {
      relevanceWeight: 0.2,
      technicalWeight: 0.45,
      communicationWeight: 0.15,
      problemSolvingWeight: 0.15,
      confidenceWeight: 0.05,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'q_rob_02',
    category: 'TECHNICAL',
    roleCategory: 'Autonomous Navigation Specialist',
    difficulty: 'MEDIUM',
    title: 'ROS 2 DDS & Real-Time Communication',
    prompt: 'How does ROS 2 achieve deterministic, real-time communication compared to ROS 1? Explain the role of DDS QoS (Quality of Service) profiles in handling sensor streams like LiDAR vs command signals.',
    expectedDurationSec: 100,
    idealBenchmarkAnswer: 'ROS 2 replaces the centralized roscore master of ROS 1 with the OMG Data Distribution Service (DDS) standard, enabling decentralized peer-to-peer discovery and real-time publish-subscribe messaging. Real-time deterministic execution is supported through custom memory allocators and the ROS 2 Real-Time executor. DDS Quality of Service (QoS) profiles allow fine-grained network tuning: for high-frequency sensor streams like 3D LiDAR point clouds, we use Best Effort reliability with volatile durability and small queue depth (SensorData QoS) to prevent packet queues from causing latency. Conversely, for critical motor command signals and trajectory goals, we enforce Reliable QoS with transient local durability to guarantee zero packet loss.',
    keyConcepts: [
      'ROS 2',
      'DDS',
      'Quality of Service',
      'Best Effort reliability',
      'Reliable QoS',
      'LiDAR point cloud',
      'Decentralized discovery',
      'Real-Time Executor'
    ],
    antiPatterns: [
      'using ROS 1 roscore in production',
      'putting heavy sensor data on reliable blocking queues'
    ],
    rubric: {
      relevanceWeight: 0.25,
      technicalWeight: 0.4,
      communicationWeight: 0.15,
      problemSolvingWeight: 0.15,
      confidenceWeight: 0.05,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'q_rob_03',
    category: 'CONTROL_SYSTEMS',
    roleCategory: 'Robotics Control Engineer',
    difficulty: 'HARD',
    title: 'Sensor Fusion & Extended Kalman Filter (EKF)',
    prompt: 'Walk through how an Extended Kalman Filter (EKF) or Unscented Kalman Filter (UKF) fuses IMU accelerometer/gyro readings with wheel odometry and GPS/UWB positioning for mobile robot state estimation.',
    expectedDurationSec: 120,
    idealBenchmarkAnswer: 'Sensor fusion combines high-frequency noisy proprioceptive sensors (IMU, wheel encoders) with lower-frequency exteroceptive ground-truth sensors (GPS/UWB/LiDAR odometry). The EKF operates in two stages: Prediction and Update. In the Prediction step, non-linear kinematic state equations propagate position, orientation, and velocity using IMU gyro integration and wheel speeds, while projecting state covariance forward with the linearized Jacobian F. In the Update step, when GPS or visual landmarks arrive, the measurement residual (innovation) is calculated. The Kalman Gain K is computed by balancing state covariance against measurement noise covariance R. The state estimate and error covariance P are updated accordingly, providing an optimal minimum mean square error pose estimate.',
    keyConcepts: [
      'Extended Kalman Filter',
      'IMU',
      'Wheel Odometry',
      'Prediction and Update',
      'Jacobian linearization',
      'Kalman Gain',
      'Covariance matrix',
      'Sensor fusion'
    ],
    antiPatterns: [
      'direct raw sensor averaging without noise modeling',
      'assuming linear dynamics without Taylor expansion'
    ],
    rubric: {
      relevanceWeight: 0.2,
      technicalWeight: 0.45,
      communicationWeight: 0.15,
      problemSolvingWeight: 0.15,
      confidenceWeight: 0.05,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'q_rob_04',
    category: 'EMBEDDED_C_CPP',
    roleCategory: 'Embedded Robotics Systems Engineer',
    difficulty: 'HARD',
    title: 'Real-Time C++ & Memory Management in Robotics',
    prompt: 'Why is dynamic memory allocation (malloc/new) strictly prohibited in hard real-time robot control loops (e.g. 1kHz motor controller)? How do you design lock-free and deterministic structures in modern C++?',
    expectedDurationSec: 110,
    idealBenchmarkAnswer: 'Dynamic memory allocation via malloc or new has non-deterministic time complexity because the memory allocator may traverse heap free-lists, trigger page faults, or cause heap fragmentation. In a 1kHz hard real-time control loop (1 millisecond deadline), an unpredictable 5ms allocation delay causes deadline miss and physical instability in actuator control. In modern C++, we pre-allocate memory during initialization, use stack-based structures (std::array), memory pools (pmr::monotonic_buffer_resource), and avoid dynamic std::vector resizing. For inter-thread communication between non-real-time sensor threads and real-time control threads, we employ lock-free Single-Producer Single-Consumer (SPSC) ring buffers utilizing std::atomic with memory_order_acquire/release semantics, preventing priority inversion and mutex blocking.',
    keyConcepts: [
      'Dynamic memory allocation',
      'Non-deterministic latency',
      '1kHz control loop',
      'Memory pools',
      'Lock-free ring buffer',
      'std::atomic',
      'Priority inversion',
      'Heap fragmentation'
    ],
    antiPatterns: [
      'calling new or malloc inside loop',
      'using blocking std::mutex on real-time thread',
      'ignoring thread priority'
    ],
    rubric: {
      relevanceWeight: 0.2,
      technicalWeight: 0.5,
      communicationWeight: 0.15,
      problemSolvingWeight: 0.1,
      confidenceWeight: 0.05,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'q_rob_05',
    category: 'TECHNICAL',
    roleCategory: 'Computer Vision & AI Specialist',
    difficulty: 'MEDIUM',
    title: 'Edge AI Acceleration for Real-Time Robot Vision',
    prompt: 'How do you optimize a deep neural network (e.g. YOLOv8 or SegNet) for real-time 60 FPS inference on edge hardware like NVIDIA Jetson Orin or embedded NPUs? Discuss quantization and TensorRT optimization.',
    expectedDurationSec: 100,
    idealBenchmarkAnswer: 'Optimizing deep learning models for edge robotics requires minimizing memory bandwidth and maximizing tensor core utilization. The workflow involves converting PyTorch/ONNX models to TensorRT execution engines. First, we apply FP16 half-precision or INT8 post-training quantization (PTQ) with representative calibration datasets to maintain accuracy within 1% of FP32 while reducing memory footprint by 4x. Second, TensorRT performs layer fusion (combining Conv, Bias, ReLU into single CUDA kernels), kernel auto-tuning for specific GPU architecture, and dynamic tensor memory reuse. Finally, zero-copy unified memory or CUDA streams allow asynchronous camera DMA capture and inference overlapping.',
    keyConcepts: [
      'TensorRT',
      'INT8 Quantization',
      'Layer fusion',
      'NVIDIA Jetson',
      'ONNX',
      'Post-training quantization',
      'CUDA streams',
      'FPS optimization'
    ],
    antiPatterns: [
      'running raw FP32 PyTorch in Python on edge',
      'blocking CPU while waiting for GPU sync'
    ],
    rubric: {
      relevanceWeight: 0.25,
      technicalWeight: 0.4,
      communicationWeight: 0.15,
      problemSolvingWeight: 0.15,
      confidenceWeight: 0.05,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  }
];
