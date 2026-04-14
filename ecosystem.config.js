module.exports = {
  apps: [
    {
      name: "visaapp",
      script: "src/server.ts",
      interpreter: "node",
      interpreter_args: "-r ts-node/register",
      env: {
        DB_HOST: "localhost",
        DB_PORT: 5436,
        DB_NAME: "docUpload",
        DB_USER: "postgres",
        DB_PASSWORD: "password",
      },
    },
  ],
};
