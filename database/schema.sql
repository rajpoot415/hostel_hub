-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostel_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  floor INTEGER,
  branch TEXT,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  occupied_seats INTEGER NOT NULL DEFAULT 0 CHECK (occupied_seats >= 0 AND occupied_seats <= capacity),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(hostel_id, floor, COALESCE(branch, ''), room_number)
);

-- Create residents table
CREATE TABLE IF NOT EXISTS residents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hostel_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  admission_date DATE NOT NULL,
  emergency_contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'left')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create rents table
CREATE TABLE IF NOT EXISTS rents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0 AND paid_amount <= amount),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('paid', 'due', 'partial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create notices table
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE NOT NULL,
  notice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  leaving_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for rooms
CREATE POLICY "Users can view their own hostel rooms"
  ON rooms FOR SELECT
  USING (hostel_id = auth.uid());

CREATE POLICY "Users can insert rooms for their hostel"
  ON rooms FOR INSERT
  WITH CHECK (hostel_id = auth.uid());

CREATE POLICY "Users can update their own hostel rooms"
  ON rooms FOR UPDATE
  USING (hostel_id = auth.uid());

-- RLS Policies for residents
CREATE POLICY "Users can view their own hostel residents"
  ON residents FOR SELECT
  USING (hostel_id = auth.uid());

CREATE POLICY "Users can insert residents for their hostel"
  ON residents FOR INSERT
  WITH CHECK (hostel_id = auth.uid());

CREATE POLICY "Users can update their own hostel residents"
  ON residents FOR UPDATE
  USING (hostel_id = auth.uid());

-- RLS Policies for rents
CREATE POLICY "Users can view rents for their hostel residents"
  ON rents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = rents.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rents for their hostel residents"
  ON rents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = rents.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rents for their hostel residents"
  ON rents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = rents.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can view documents for their hostel residents"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = documents.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents for their hostel residents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = documents.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents for their hostel residents"
  ON documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = documents.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

-- RLS Policies for notices
CREATE POLICY "Users can view notices for their hostel residents"
  ON notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = notices.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notices for their hostel residents"
  ON notices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = notices.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notices for their hostel residents"
  ON notices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = notices.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notices for their hostel residents"
  ON notices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM residents
      WHERE residents.id = notices.resident_id
      AND residents.hostel_id = auth.uid()
    )
  );

-- Function to automatically create profile on user signup
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

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update rent status based on paid_amount
CREATE OR REPLACE FUNCTION update_rent_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount = 0 THEN
    NEW.status := 'due';
  ELSIF NEW.paid_amount = NEW.amount THEN
    NEW.status := 'paid';
  ELSE
    NEW.status := 'partial';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rent status
DROP TRIGGER IF EXISTS update_rent_status_trigger ON rents;
CREATE TRIGGER update_rent_status_trigger
  BEFORE INSERT OR UPDATE ON rents
  FOR EACH ROW EXECUTE FUNCTION update_rent_status();

