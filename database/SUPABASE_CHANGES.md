# Supabase Changes Required for Signup Flow

## ✅ Required Changes

### 1. Add INSERT Policy for Profiles Table

**Why:** Users need to be able to insert their own profile when they sign up.

**SQL to Run:**
```sql
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 2. Update the Trigger Function to Handle Phone

**Why:** The trigger should also save the phone number from user metadata.

**SQL to Run:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📋 Complete Updated Schema Section

The updated `database/schema.sql` file already includes these changes. You can:

1. **Option A:** Run the entire updated `schema.sql` file in Supabase SQL Editor
2. **Option B:** Run only the two SQL statements above

## 🔍 Verification

After applying changes, verify:

1. **Check RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   Should show 3 policies: SELECT, INSERT, UPDATE

2. **Test Signup:**
   - Create a new account via the app
   - Check if profile is created automatically
   - Verify name and phone are saved correctly

## ⚠️ Important Notes

- The trigger runs with `SECURITY DEFINER`, so it bypasses RLS
- The explicit profile insert in `AuthContext.signUp()` is a backup
- Both methods (trigger + explicit insert) ensure profile creation works
- If trigger fails, explicit insert will still create the profile

