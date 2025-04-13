module.exports = {
  apps: [
    {
      name: 'qiaomu-blog',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 'max', 
      exec_mode: 'cluster', 
      autorestart: true,
      watch: false,
      max_memory_restart: '300M', 
      env: {
        NODE_ENV: 'production',
        PORT: 3009
      },
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/error.log",
      out_file: "./logs/output.log",
      node_args: "--max-old-space-size=256",
      wait_ready: true,
      listen_timeout: 5000,
      kill_timeout: 3000
    }
  ]
};
