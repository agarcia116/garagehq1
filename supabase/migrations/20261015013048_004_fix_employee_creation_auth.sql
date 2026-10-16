/*
# Fix: Employee creation and auth.users permission

## Problem
The shop_members INSERT policy references auth.users to check if the
shop's owner_email matches the current user's email. But the authenticated
role doesn't have SELECT permission on auth.users, causing a 403 error.

## Fix
1. Create a SECURITY DEFINER function that checks if a user's email matches
   a shop's owner_email (bypasses RLS and auth.users permission issue)
2. Update the INSERT policy to use this function instead of querying auth.users directly
*/

-- Helper: check if current user's email matches a shop's owner_email
CREATE OR REPLACE FUNCTION user_email_matches_shop(check_shop_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shops s
    JOIN auth.users u ON u.id = auth.uid()
    WHERE s.id = check_shop_id
    AND s.owner_email = u.email
  );
$$;

-- Update the INSERT policy to use the new function
DROP POLICY IF EXISTS "members_insert_own_shop" ON shop_members;
CREATE POLICY "members_insert_own_shop" ON shop_members FOR INSERT
  TO authenticated WITH CHECK (
    -- Bootstrap: user inserting themselves as owner of a new shop
    (
      shop_members.role = 'owner'
      AND shop_members.user_id = auth.uid()
      AND user_email_matches_shop(shop_members.shop_id)
    )
    -- Normal: existing owner is adding a new member
    OR is_shop_owner(shop_members.shop_id)
  );
