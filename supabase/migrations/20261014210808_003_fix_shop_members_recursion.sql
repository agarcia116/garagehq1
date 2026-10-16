/*
# Fix: Infinite recursion in shop_members RLS policies

## Problem
The shop_members SELECT policy used a subquery against shop_members itself:
  USING (shop_id IN (SELECT shop_id FROM shop_members WHERE user_id = auth.uid()))
This caused infinite recursion — checking the policy requires reading shop_members,
which triggers the policy, which requires reading shop_members, etc.

The INSERT, UPDATE, and DELETE policies had a similar issue — they queried
shop_members in a subquery to check if an owner exists, which also recurses.

## Fix
Replace all self-referencing subqueries with the is_shop_member() SECURITY DEFINER
function, which bypasses RLS and avoids recursion. For INSERT, create a separate
SECURITY DEFINER function to check if the user is an owner of a shop.
*/

-- Helper: check if current user is an owner/admin of a shop (bypasses RLS)
CREATE OR REPLACE FUNCTION is_shop_admin(check_shop_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shop_members
    WHERE shop_members.shop_id = check_shop_id
    AND shop_members.user_id = auth.uid()
    AND shop_members.role IN ('owner','admin')
  );
$$;

-- Helper: check if current user is an owner of a shop (bypasses RLS)
CREATE OR REPLACE FUNCTION is_shop_owner(check_shop_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shop_members
    WHERE shop_members.shop_id = check_shop_id
    AND shop_members.user_id = auth.uid()
    AND shop_members.role = 'owner'
  );
$$;

-- ============================================================
-- SHOPS: Fix policies to use SECURITY DEFINER functions
-- ============================================================
DROP POLICY IF EXISTS "members_read_own_shop" ON shops;
CREATE POLICY "members_read_own_shop" ON shops FOR SELECT
  TO authenticated USING (is_shop_member(id));

DROP POLICY IF EXISTS "members_update_own_shop" ON shops;
CREATE POLICY "members_update_own_shop" ON shops FOR UPDATE
  TO authenticated USING (is_shop_member(id)) WITH CHECK (is_shop_member(id));

DROP POLICY IF EXISTS "members_insert_own_shop" ON shops;
CREATE POLICY "members_insert_own_shop" ON shops FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================================
-- SHOP_MEMBERS: Fix all policies to avoid recursion
-- ============================================================

-- SELECT: user can read rows for shops they belong to
DROP POLICY IF EXISTS "members_select_own_shop" ON shop_members;
CREATE POLICY "members_select_own_shop" ON shop_members FOR SELECT
  TO authenticated USING (is_shop_member(shop_id));

-- INSERT: bootstrap path (user creating themselves as owner of new shop)
--         OR an existing owner adding a new member
DROP POLICY IF EXISTS "members_insert_own_shop" ON shop_members;
CREATE POLICY "members_insert_own_shop" ON shop_members FOR INSERT
  TO authenticated WITH CHECK (
    -- Bootstrap: user inserting themselves as owner, shop's owner_email matches
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
    -- Normal: existing owner is adding a new member
    OR is_shop_owner(shop_members.shop_id)
  );

-- UPDATE: owner/admin can update members of their shop
DROP POLICY IF EXISTS "members_update_own_shop" ON shop_members;
CREATE POLICY "members_update_own_shop" ON shop_members FOR UPDATE
  TO authenticated USING (is_shop_admin(shop_id)) WITH CHECK (is_shop_admin(shop_id));

-- DELETE: owner/admin can remove members from their shop
DROP POLICY IF EXISTS "members_delete_own_shop" ON shop_members;
CREATE POLICY "members_delete_own_shop" ON shop_members FOR DELETE
  TO authenticated USING (is_shop_admin(shop_id));
