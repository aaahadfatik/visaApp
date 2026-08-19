module.exports = {
  apps: [
    {
      name: "visaapp",
      script: "src/server.ts",
      interpreter: "node",
      interpreter_args: "-r ts-node/register",
      watch: false,
      env: {
        NODE_ENV: "production",
        DB_HOST: "localhost",
        DB_PORT: 5432,
        DB_NAME: "docUpload",
        DB_USER: "postgres",
        DB_PASSWORD: "password",
        CORS_ORIGINS: "https://admin.alem.ae",
      },
    },
  ],
};
