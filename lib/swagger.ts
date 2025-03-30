import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "LinkNest APIs",
        version: "1.0.0",
        description: "API documentation for LinkNest",
      },
    },
  });

  return spec;
};
