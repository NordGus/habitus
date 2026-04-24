export default {
  providers: [
    {
      // Clerk JWT issuer — Convex fetches /.well-known/openid-configuration to discover JWKS.
      // applicationID must match the `aud` claim in the Clerk "convex" JWT template.
      domain: "https://golden-spaniel-65.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
