module.exports = {
  apps : [
    {
      name: "kue-escalafon",
      script: "./ace",
      args: "kue:listen",
      instances : "4",
      exec_mode: "cluster"
    },
    {
      name: "scheduler-escalafon",
      script: "./ace",
      args: "run:scheduler",
      instances : "2",
      exec_mode: "cluster"
    },
    {
      name: "escalafon",
      script: "./server.js",
    }
  ]
}