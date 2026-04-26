export default {
  providers: [
    {
      // Clerk JWT issuer — Convex fetches /.well-known/openid-configuration to discover JWKS.
      // applicationID must match the `aud` claim in the Clerk "convex" JWT template.
      domain: import.meta.env.VITE_CLERK_FRONTEND_API_URL!,
      applicationID: "convex",
    },
  ],
};
