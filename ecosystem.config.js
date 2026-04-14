module.exports = {
  apps: [
    {
      name: "visaapp",
      script: "dist/index.js",
      env: {
        DB_HOST: "localhost",
        DB_PORT: 5436,
        DB_NAME: "docUpload",
        DB_USERNAME: "postgres",
        DB_PASSWORD: "password",
      },
    },
  ],
};
