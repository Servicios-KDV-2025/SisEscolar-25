
const domain = process.env.CLERK_JWT_ISSUER_DOMAIN?.trim();

if (!domain) {
  throw new Error(
    "Missing CLERK_JWT_ISSUER_DOMAIN environment variable for Convex auth config."
  );
}

export default {
  providers: [
    {
      // domain,
      // applicationID: "convex",
      type:"customJwt",
      applicationID: "convex",
      issuer: domain,
      jwks:"https://cuddly-parrot-87.clerk.accounts.dev/.well-known/jwks.json",
      algorithm:"RS256"
    },
  ],
};