import { supabase } from '../lib/supabase';
import { Student, Arrear, Notification, Transaction, AppUser, StudentPermission } from '../types';

export const databaseService = {
  // Students
  async getStudents() {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase.from('students').select('*, arrears(amount, status)').order('name').range(from, from + step - 1);
      if (error) throw error;
      allData = [...allData, ...data];
      if (data.length < step) break;
      from += step;
    }
    return allData.map(s => {
      const studentArrears = (s.arrears || []).filter((a: any) => a.status !== 'Lunas');
      const totalArrears = studentArrears.reduce((sum: number, a: any) => sum + Number(a.amount), 0);

      return {
        id: s.id,
        name: s.name,
        class: s.class,
        parentName: s.parent_name,
        whatsapp: s.whatsapp,
        gender: s.gender,
        residenceStatus: s.residence_status,
        dispensationStatus: s.dispensation_status || false,
        dispensationReason: s.dispensation_reason || '',
        barcodeId: s.barcode_id || '',
        statusPerizinan: s.status_perizinan || 'Di Dalam',
        nisn: s.nisn || '',
        alamat: s.alamat || '',
        tempatLahir: s.tempat_lahir || '',
        tanggalLahir: s.tanggal_lahir || '',
        photoUrl: s.photo_url || '',
        totalArrears
      };
    }) as Student[];
  },

  async addStudent(data: Omit<Student, 'id' | 'totalArrears'>) {
    const { data: res, error } = await supabase.from('students').insert([{
      name: data.name,
      class: data.class,
      parent_name: data.parentName,
      whatsapp: data.whatsapp,
      gender: data.gender,
      residence_status: data.residenceStatus,
      dispensation_status: data.dispensationStatus || false,
      dispensation_reason: data.dispensationReason || '',
      barcode_id: data.barcodeId || '',
      status_perizinan: data.statusPerizinan || 'Di Dalam',
      nisn: data.nisn || '',
      alamat: data.alamat || '',
      tempat_lahir: data.tempatLahir || '',
      tanggal_lahir: data.tanggalLahir || '',
      photo_url: data.photoUrl || ''
    }]).select();
    if (error) throw error;
    return res[0];
  },

  async batchAddStudents(students: Omit<Student, 'id' | 'totalArrears'>[]) {
    if (students.length === 0) return;
    const payload = students.map(data => ({
      name: data.name,
      class: data.class,
      parent_name: data.parentName,
      whatsapp: data.whatsapp,
      gender: data.gender,
      residence_status: data.residenceStatus,
      dispensation_status: data.dispensationStatus || false,
      dispensation_reason: data.dispensationReason || '',
      barcode_id: data.barcodeId || '',
      status_perizinan: data.statusPerizinan || 'Di Dalam',
      nisn: data.nisn || '',
      alamat: data.alamat || '',
      tempat_lahir: data.tempatLahir || '',
      tanggal_lahir: data.tanggalLahir || '',
      photo_url: data.photoUrl || ''
    }));

    const { error } = await supabase.from('students').insert(payload);
    if (error) throw error;
  },

  async updateStudent(id: string, data: Partial<Student>) {
    const mapped: any = { ...data };
    if (data.parentName !== undefined) mapped.parent_name = data.parentName;
    if (data.residenceStatus !== undefined) mapped.residence_status = data.residenceStatus;
    if (data.dispensationStatus !== undefined) mapped.dispensation_status = data.dispensationStatus;
    if (data.dispensationReason !== undefined) mapped.dispensation_reason = data.dispensationReason;
    if (data.barcodeId !== undefined) mapped.barcode_id = data.barcodeId;
    if (data.statusPerizinan !== undefined) mapped.status_perizinan = data.statusPerizinan;
    if (data.tempatLahir !== undefined) mapped.tempat_lahir = data.tempatLahir;
    if (data.tanggalLahir !== undefined) mapped.tanggal_lahir = data.tanggalLahir;
    if (data.photoUrl !== undefined) mapped.photo_url = data.photoUrl;
    delete mapped.parentName;
    delete mapped.residenceStatus;
    delete mapped.dispensationStatus;
    delete mapped.dispensationReason;
    delete mapped.barcodeId;
    delete mapped.statusPerizinan;
    delete mapped.tempatLahir;
    delete mapped.tanggalLahir;
    delete mapped.photoUrl;
    delete mapped.totalArrears;

    const { error } = await supabase.from('students').update(mapped).eq('id', id);
    if (error) throw error;
  },

  async deleteStudent(id: string) {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  },

  // Arrears
  async getArrears() {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase.from('arrears').select('*').range(from, from + step - 1);
      if (error) throw error;
      allData = [...allData, ...data];
      if (data.length < step) break;
      from += step;
    }
    return allData.map(a => ({
      id: a.id,
      studentId: a.student_id,
      type: a.type,
      month: a.month,
      amount: a.amount,
      status: a.status,
      dueDate: a.due_date
    })) as Arrear[];
  },

  async addArrear(data: Omit<Arrear, 'id' | 'status'>) {
    const { data: res, error } = await supabase.from('arrears').insert([{
      student_id: data.studentId,
      type: data.type,
      month: data.month,
      amount: data.amount,
      status: 'Belum Lunas',
      due_date: data.dueDate
    }]).select();
    if (error) throw error;
    return res[0];
  },

  async batchAddArrears(arrears: Omit<Arrear, 'id' | 'status'>[]) {
    if (arrears.length === 0) return;
    const payload = arrears.map(data => ({
      student_id: data.studentId,
      type: data.type,
      month: data.month,
      amount: data.amount,
      status: 'Belum Lunas',
      due_date: data.dueDate
    }));

    const { error } = await supabase.from('arrears').insert(payload);
    if (error) throw error;
  },

  async updateArrear(id: string, data: Partial<Arrear>) {
    const mapped: any = { ...data };
    if (data.studentId) mapped.student_id = data.studentId;
    if (data.dueDate) mapped.due_date = data.dueDate;
    delete mapped.studentId;
    delete mapped.dueDate;

    const { error } = await supabase.from('arrears').update(mapped).eq('id', id);
    if (error) throw error;
  },

  async deleteArrear(id: string) {
    const { error } = await supabase.from('arrears').delete().eq('id', id);
    if (error) throw error;
  },

  // Transactions
  async getTransactions() {
    const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(t => ({
      id: t.id,
      studentId: t.student_id,
      studentName: t.student_name,
      type: t.type,
      amount: t.amount,
      paymentCategory: t.payment_category,
      description: t.description,
      date: new Date(t.created_at).toLocaleString('id-ID'),
      performedBy: t.performed_by || 'Sistem'
    })) as Transaction[];
  },

  async logTransaction(data: Omit<Transaction, 'id' | 'date'>) {
    const { data: res, error } = await supabase.from('transactions').insert([{
      student_id: data.studentId,
      student_name: data.studentName,
      type: data.type,
      amount: data.amount,
      payment_category: data.paymentCategory,
      description: data.description,
      performed_by: data.performedBy,
      created_at: new Date().toISOString()
    }]).select();
    if (error) throw error;
    return res[0];
  },

  // Notifications
  async getNotifications() {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(n => ({
      id: n.id,
      studentId: n.student_id,
      studentName: n.student_name,
      parentName: n.parent_name,
      whatsapp: n.whatsapp,
      date: new Date(n.created_at).toLocaleString('id-ID'),
      status: n.status,
      type: n.type
    })) as Notification[];
  },

  async logNotification(data: { studentId: string; studentName: string; parentName: string; whatsapp: string; status: 'Berhasil' | 'Gagal' | 'Pending' }) {
    const { data: res, error } = await supabase.from('notifications').insert([{
      student_id: data.studentId,
      student_name: data.studentName,
      parent_name: data.parentName,
      whatsapp: data.whatsapp,
      status: data.status,
      created_at: new Date().toISOString()
    }]).select();
    if (error) throw error;
    return res[0];
  },

  // Profiles/Users
  async getUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      status: p.status,
      lastActive: 'Aktif'
    })) as AppUser[];
  },

  async updateUserRole(id: string, role: AppUser['role']) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;
  },

  // Permissions (Perizinan)
  async getPermissions() {
    const { data, error } = await supabase
      .from('permissions')
      .select('*, students(name, class), profiles(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(p => {
      let type = p.type;
      let reason = p.reason || '';
      const match = reason.match(/^\[(.*?)\]\s*(.*)/);
      if (match) {
        type = match[1];
        reason = match[2];
      }
      return {
        id: p.id,
        studentId: p.student_id,
        studentName: p.students?.name || 'Siswa Terhapus',
        studentClass: p.students?.class || '-',
        type,
        reason,
        durationHours: p.duration_hours,
        startDate: p.start_date,
        expectedReturnDate: p.expected_return_date,
        actualReturnDate: p.actual_return_date,
        status: p.status,
        createdBy: p.created_by,
        createdByName: p.profiles?.name || 'Sistem',
        notes: p.notes
      };
    }) as StudentPermission[];
  },

  async addPermission(data: Omit<StudentPermission, 'id' | 'startDate' | 'status'>) {
    const allowedTypes = ['Pulang', 'Keluar Singkat', 'Sakit', 'Lainnya'];
    const isCustomType = !allowedTypes.includes(data.type);
    const dbType = isCustomType ? 'Pulang' : data.type;
    const dbReason = isCustomType ? `[${data.type}] ${data.reason}` : data.reason;

    const { data: res, error } = await supabase
      .from('permissions')
      .insert([{
        student_id: data.studentId,
        type: dbType,
        reason: dbReason,
        duration_hours: data.durationHours,
        expected_return_date: data.expectedReturnDate,
        status: 'Aktif',
        created_by: data.createdBy,
        notes: data.notes
      }])
      .select('*, students(name, class), profiles(name)');
    if (error) throw error;
    
    // Update student's state to "Di Luar"
    await this.updateStudent(data.studentId, { statusPerizinan: 'Di Luar' });
    
    return {
      id: res[0].id,
      studentId: res[0].student_id,
      studentName: res[0].students?.name || 'Siswa Terhapus',
      studentClass: res[0].students?.class || '-',
      type: data.type,
      reason: data.reason,
      durationHours: res[0].duration_hours,
      startDate: res[0].start_date,
      expectedReturnDate: res[0].expected_return_date,
      actualReturnDate: res[0].actual_return_date,
      status: res[0].status,
      createdBy: res[0].created_by,
      createdByName: res[0].profiles?.name || 'Sistem',
      notes: res[0].notes
    } as StudentPermission;
  },

  async checkInPermission(permissionId: string, studentId: string, status: 'Kembali' | 'Terlambat', notes?: string) {
    const { error } = await supabase
      .from('permissions')
      .update({
        status,
        actual_return_date: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', permissionId);
    if (error) throw error;

    // Update student's state to "Di Dalam"
    await this.updateStudent(studentId, { statusPerizinan: 'Di Dalam' });
  },

  async updatePermission(permissionId: string, data: Partial<StudentPermission>) {
    const mapped: any = {};
    if (data.expectedReturnDate !== undefined) mapped.expected_return_date = data.expectedReturnDate;
    if (data.notes !== undefined) mapped.notes = data.notes;
    if (data.durationHours !== undefined) mapped.duration_hours = data.durationHours;

    const { error } = await supabase.from('permissions').update(mapped).eq('id', permissionId);
    if (error) throw error;
  },

  async getStudentByBarcode(barcodeId: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('barcode_id', barcodeId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      class: data.class,
      parentName: data.parent_name,
      whatsapp: data.whatsapp,
      gender: data.gender,
      residenceStatus: data.residence_status,
      dispensationStatus: data.dispensation_status || false,
      dispensationReason: data.dispensation_reason || '',
      barcodeId: data.barcode_id || '',
      statusPerizinan: data.status_perizinan || 'Di Dalam',
      totalArrears: 0
    } as Student;
  }
};
