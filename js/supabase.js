/* Public browser configuration. Access is restricted by Supabase Auth + RLS. */
window.TidyConfig = {
  url: 'https://mhfvwzfoupeltdccpvmc.supabase.co',
  publishableKey: 'sb_publishable_Hv0sxbRIKwdnxzvY4GHQHQ_kYgB-s4U',
  // Public VAPID application-server key. Set this to the public half of your
  // generated key pair; the private key belongs only in Supabase Function secrets.
  vapidPublicKey: 'BNLd_jFclRpua1zQlu_2AY8r5RuMu9KwpIWzsxBp-NrF8q2MmNEYEnHDhKg-3cP0Gvzg-UHHDt2dO78VpPFLWBk'
};
window.tidyClient = window.supabase?.createClient(TidyConfig.url, TidyConfig.publishableKey, {
  auth: {
    // Remember sessions between page loads and refresh expiring access tokens.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});
