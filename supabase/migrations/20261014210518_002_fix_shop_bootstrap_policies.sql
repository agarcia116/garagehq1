/*
# Fix: Shop creation and owner bootstrap RLS policies

## Problem
The shop_members INSERT policy required an existing owner in shop_members
to authorize new inserts. This created a chicken-and-egg problem: the first
owner could never be inserted because no owner existed yet.

Additionally, the shops table had no INSERT policy, meaning no authenticated
user could create a new shop through the frontend.

## Changes
1. Add INSERT policy on shops — any authenticated user can create a shop
2. Fix shop_members INSERT policy — allow a user to insert themselves as
   owner if their email matches the shop's owner_email (bootstrap path),
   OR if an existing owner/admin authorizes the insert (normal path)
3. Insert the missing shop_member record for the existing shop owner
*/

-- ============================================================
-- SHOPS: Add INSERT policy
-- ============================================================
DROP POLICY IF EXISTS "members_insert_own_shop" ON shops;
CREATE POLICY "members_insert_own_shop" ON shops FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================================
-- SHOP_MEMBERS: Fix INSERT policy (chicken-and-egg fix)
-- ============================================================
DROP POLICY IF EXISTS "members_insert_own_shop" ON shop_members;
CREATE POLICY "members_insert_own_shop" ON shop_members FOR INSERT
  TO authenticated WITH CHECK (
    -- Bootstrap path: user is inserting themselves as owner of a new shop
    -- where the shop's owner_email matches their auth email
    (
      shop_members.role = 'owner'
      AND shop_members.user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM shops
        WHERE shops.id = shop_members.shop_id
        AND shops.owner_email = (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
      )
    )
    -- Normal path: an existing owner/admin is adding a new member
    OR (
      EXISTS (
        SELECT 1 FROM shop_members sm
        WHERE sm.user_id = auth.uid()
        AND sm.shop_id = shop_members.shop_id
        AND sm.role = 'owner'
      )
    )
  );

-- ============================================================
-- Repair: Insert missing shop_member for existing shop owner
-- ============================================================
INSERT INTO shop_members (shop_id, user_id, role, full_name, email)
SELECT s.id, u.id, 'owner', s.name, s.owner_email
FROM shops s
JOIN auth.users u ON u.email = s.owner_email
WHERE NOT EXISTS (
  SELECT 1 FROM shop_members sm
  WHERE sm.shop_id = s.id AND sm.user_id = u.id
)
ON CONFLICT (shop_id, user_id) DO NOTHING;
