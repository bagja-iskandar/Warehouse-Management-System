const { PrismaClient } = require('../backend/node_modules/@prisma/client');

async function auditSecurity() {
  const prisma = new PrismaClient();
  try {
    console.log('========================================================================');
    console.log('🔍 SUPABASE SECURITY AUDIT — SCHEMA & PRIVILEGES');
    console.log('========================================================================\n');

    // 1. Audit public tables and RLS status
    const tables = await prisma.$queryRaw`
      SELECT 
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        c.relforcerowsecurity AS rls_forced,
        pg_get_userbyid(c.relowner) AS owner
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname;
    `;

    console.log('1. PUBLIC TABLES AND CURRENT RLS STATUS:');
    console.table(tables);

    // 2. Audit Table Grants for anon, authenticated, public
    const grants = await prisma.$queryRaw`
      SELECT 
        grantee, 
        table_name, 
        privilege_type
      FROM information_schema.role_table_grants 
      WHERE table_schema = 'public' 
        AND grantee IN ('anon', 'authenticated', 'PUBLIC', 'service_role')
      ORDER BY table_name, grantee, privilege_type;
    `;

    console.log(`\n2. PERMISSIONS GRANTED TO anon / authenticated / PUBLIC / service_role: (${grants.length} grants)`);
    // Group grants by grantee
    const grantsByGrantee = {};
    grants.forEach(g => {
      if (!grantsByGrantee[g.grantee]) grantsByGrantee[g.grantee] = new Set();
      grantsByGrantee[g.grantee].add(g.privilege_type);
    });
    for (const [grantee, privs] of Object.entries(grantsByGrantee)) {
      console.log(`- Grantee [${grantee}]: ${Array.from(privs).join(', ')}`);
    }

    // 3. Check Views in public schema
    const views = await prisma.$queryRaw`
      SELECT table_name, view_definition 
      FROM information_schema.views 
      WHERE table_schema = 'public';
    `;
    console.log(`\n3. PUBLIC VIEWS: ${views.length}`);
    views.forEach(v => console.log(`- View: ${v.table_name}`));

    // 4. Check Functions in public schema
    const functions = await prisma.$queryRaw`
      SELECT 
        p.proname AS function_name,
        pg_get_userbyid(p.proowner) AS function_owner,
        p.prosecdef AS is_security_definer
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      ORDER BY p.proname;
    `;
    console.log(`\n4. PUBLIC FUNCTIONS: ${functions.length}`);
    functions.forEach(f => console.log(`- Function: ${f.function_name} (Owner: ${f.function_owner}, Security Definer: ${f.is_security_definer})`));

  } catch (error) {
    console.error('Audit failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

auditSecurity();
