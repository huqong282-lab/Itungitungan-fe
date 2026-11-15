import { useState } from 'react'
import { Activity, CalendarDays, Check, CircleHelp, Layers3, LayoutDashboard, Palette, Settings2, Sparkles } from 'lucide-react'
import { Alert, Badge, Button, Card, Checkbox, DatePicker, Dropdown, EmptyState, ErrorState, FormField, FormSection, Input, Modal, MultiSelect, Pagination, Radio, SearchInput, Select, Skeleton, SkeletonCard, SkeletonTableRow, Switch, Table, Tabs, Textarea, ToastProvider, useToast, Drawer } from '../components/ui'
import type { BadgeVariant, TableColumn } from '../components/ui'
import './ComponentShowcasePage.css'

type Category = 'forms' | 'data' | 'interactive' | 'navigation'
const categories: { id: Category; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'forms', label: 'Form Components', icon: Settings2 },
  { id: 'data', label: 'Data Display', icon: Layers3 },
  { id: 'interactive', label: 'Interactive', icon: Activity },
  { id: 'navigation', label: 'Navigation', icon: LayoutDashboard },
]
const componentTitles: Record<Category, string[]> = {
  forms: ['Button', 'Input', 'Textarea', 'Select', 'MultiSelect', 'DatePicker', 'Checkbox', 'Radio', 'Switch', 'FormField', 'FormSection'],
  data: ['Card', 'Table', 'Badge', 'Alert', 'Skeleton', 'EmptyState', 'ErrorState'],
  interactive: ['Toast', 'Modal', 'Drawer', 'Dropdown', 'Tabs'],
  navigation: ['SearchInput', 'Pagination'],
}
const cities = [{ value: 'jakarta', label: 'Jakarta' }, { value: 'bandung', label: 'Bandung' }, { value: 'surabaya', label: 'Surabaya' }, { value: 'balikpapan', label: 'Balikpapan' }, { value: 'makassar', label: 'Makassar' }]
const catalogRows = [
  { name: 'Autentikasi pengguna', category: 'Keamanan', hours: 12, status: 'Aktif' },
  { name: 'Integrasi pembayaran', category: 'Integrasi', hours: 20, status: 'Aktif' },
  { name: 'Dashboard analitik', category: 'Antarmuka', hours: 16, status: 'Draft' },
  { name: 'Pencarian katalog', category: 'Fungsionalitas', hours: 8, status: 'Aktif' },
]
const catalogColumns: TableColumn<typeof catalogRows[number]>[] = [
  { key: 'name', header: 'Nama fitur', render: row => <strong>{row.name}</strong> },
  { key: 'category', header: 'Kategori' },
  { key: 'hours', header: 'Estimasi', render: row => `${row.hours} jam` },
  { key: 'status', header: 'Status', render: row => <Badge variant={row.status === 'Aktif' ? 'success' : 'warning'}>{row.status}</Badge> },
]

export default function ComponentShowcasePage() { return <ToastProvider><Showcase /></ToastProvider> }

function Showcase() {
  const [activeCategory, setActiveCategory] = useState<Category>('forms')
  const [multiValue, setMultiValue] = useState(['jakarta', 'balikpapan'])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [checked, setChecked] = useState(true)
  const [billing, setBilling] = useState('monthly')
  const [notification, setNotification] = useState(true)
  const [showError, setShowError] = useState(false)
  const { toast } = useToast()
  const filteredRows = catalogRows.filter(row => row.name.toLocaleLowerCase('id').includes(search.toLocaleLowerCase('id')))

  return <div className="showcase-shell">
    <aside className="showcase-sidebar">
      <a className="showcase-brand" href="/dev/components" aria-label="Itungitungan UI Showcase"><span className="showcase-brand__mark"><Sparkles size={19} /></span><span><strong>Itungitungan</strong><small>UI Component Showcase</small></span></a>
      <div className="showcase-sidebar__label">LIBRARY</div>
      <nav aria-label="Kategori komponen" className="showcase-nav">{categories.map(category => { const Icon = category.icon; return <button key={category.id} type="button" className={activeCategory === category.id ? 'is-active' : ''} onClick={() => setActiveCategory(category.id)}><Icon size={17} /><span>{category.label}</span><span className="showcase-nav__count">{componentTitles[category.id].length}</span></button> })}</nav>
      <div className="showcase-sidebar__bottom"><span className="showcase-status-dot" /> Development preview <span>v1.0</span></div>
    </aside>
    <main className="showcase-main">
      <header className="showcase-topbar"><div className="showcase-breadcrumb">Design System <span>/</span> <strong>Components</strong></div><div className="showcase-topbar__right"><span className="showcase-dev-pill"><span className="showcase-status-dot" /> Development</span><button className="showcase-avatar" aria-label="Profil pengguna">P</button></div></header>
      <div className="showcase-content">
        <header className="showcase-page-heading"><div><div className="showcase-eyebrow"><Palette size={14} /> COMPONENT LIBRARY</div><h1>Itungitungan UI Component Showcase</h1><p>Komponen reusable dengan state dan interaksi yang siap digunakan di seluruh aplikasi.</p></div><div className="showcase-version"><span className="showcase-version__dot" /> Design System <strong>v1.0</strong></div></header>
        <section aria-label={categories.find(item => item.id === activeCategory)?.label} className="showcase-category">
          <div className="showcase-section-heading"><div><h2>{categories.find(item => item.id === activeCategory)?.label}</h2><p>{componentTitles[activeCategory].length} komponen · pilih dan coba setiap variasi</p></div><span className="showcase-count">{componentTitles[activeCategory].length} COMPONENTS</span></div>
          <div className="showcase-grid">
            {activeCategory === 'forms' && <>
              <DemoCard title="Button" description="Tombol aksi dengan variasi, ukuran, dan state loading." className="span-2"><div className="demo-stack"><div className="demo-row"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="danger">Danger</Button><Button variant="ghost">Ghost</Button></div><div className="demo-row"><Button size="small">Small</Button><Button>Medium</Button><Button size="large">Large</Button><Button loading>Memuat</Button><Button disabled>Disabled</Button></div></div></DemoCard>
              <DemoCard title="Input" description="Text, email, password, number, search, dan state error."><div className="demo-fields"><FormField label="Nama lengkap" htmlFor="demo-name"><Input id="demo-name" placeholder="Contoh: Rina Putri" /></FormField><FormField label="Email" htmlFor="demo-email"><Input id="demo-email" type="email" placeholder="nama@perusahaan.id" /></FormField><FormField label="Password" htmlFor="demo-password"><Input id="demo-password" type="password" placeholder="Masukkan password" /></FormField><FormField label="Jumlah jam" htmlFor="demo-number"><Input id="demo-number" type="number" placeholder="8" /></FormField><FormField label="State error" htmlFor="demo-error" error={showError ? 'Email belum valid.' : undefined}><Input id="demo-error" type="email" error={showError} placeholder="nama@email" />{!showError && <button className="demo-text-action" onClick={() => setShowError(true)}>Coba tampilkan error</button>}</FormField><FormField label="Disabled" htmlFor="demo-disabled"><Input id="demo-disabled" disabled value="Tidak dapat diubah" readOnly /></FormField></div></DemoCard>
              <DemoCard title="Textarea" description="Teks panjang dengan resize dan batas karakter."><FormField label="Catatan project" htmlFor="demo-notes" hint="Jelaskan kebutuhan tambahan."><Textarea id="demo-notes" placeholder="Tulis catatan di sini…" rows={4} maxLength={240} /><small className="demo-char-count">Maks. 240 karakter</small></FormField></DemoCard>
              <DemoCard title="Select" description="Pilihan tunggal dengan placeholder dan disabled option."><FormField label="Pilih peran" htmlFor="demo-role"><Select id="demo-role" placeholder="Pilih peran" options={[{ value: 'owner', label: 'Pemilik usaha' }, { value: 'developer', label: 'Developer' }, { value: 'disabled', label: 'Tidak tersedia', disabled: true }]} /></FormField></DemoCard>
              <DemoCard title="MultiSelect" description="Pilih beberapa lokasi dan hapus badge yang dipilih."><FormField label="Kota operasional" htmlFor="demo-cities"><MultiSelect label="Kota operasional" options={cities} value={multiValue} onChange={setMultiValue} placeholder="Pilih kota" /></FormField><div className="demo-note">{multiValue.length} kota dipilih</div></DemoCard>
              <DemoCard title="DatePicker" description="Pemilih tanggal native dengan dukungan keyboard."><FormField label="Tanggal mulai" htmlFor="demo-date"><DatePicker id="demo-date" defaultValue="2026-11-15" /></FormField></DemoCard>
              <DemoCard title="Checkbox" description="Pilihan independen dengan label dan status checked."><div className="demo-choice-list"><Checkbox checked={checked} onChange={event => setChecked(event.target.checked)} label="Setujui syarat penggunaan" /><Checkbox label="Kirim ringkasan melalui email" /><Checkbox disabled label="Opsi tidak tersedia" /></div></DemoCard>
              <DemoCard title="Radio" description="Pilih satu opsi dalam sebuah group."><Radio name="demo-billing" label="Periode penagihan" value={billing} onChange={setBilling} orientation="vertical" options={[{ value: 'monthly', label: 'Bulanan' }, { value: 'annual', label: 'Tahunan' }, { value: 'custom', label: 'Tidak tersedia', disabled: true }]} /></DemoCard>
              <DemoCard title="Switch" description="Kontrol biner yang bisa diubah dengan keyboard."><div className="demo-choice-list"><Switch checked={notification} onChange={event => setNotification(event.target.checked)} label="Notifikasi email" /><Switch defaultChecked={false} label="Mode gelap (demo)" /></div></DemoCard>
              <DemoCard title="FormField" description="Label, indikator wajib, hint, dan pesan validasi." className="span-2"><FormField label="Nama project" htmlFor="project-field" required hint="Gunakan nama yang mudah dikenali." error={showError ? 'Nama project wajib diisi.' : undefined}><Input id="project-field" placeholder="Contoh: Website perusahaan" error={showError} /></FormField><button className="demo-text-action" onClick={() => setShowError(!showError)}>Toggle pesan validasi</button></DemoCard>
              <DemoCard title="FormSection" description="Kelompok field dengan judul dan deskripsi." className="span-2"><FormSection title="Data akun" description="Informasi dasar untuk masuk ke sistem." divider><div className="demo-fields demo-fields--two"><FormField label="Nama" htmlFor="section-name" required><Input id="section-name" placeholder="Nama lengkap" /></FormField><FormField label="Email" htmlFor="section-email" required><Input id="section-email" type="email" placeholder="nama@perusahaan.id" /></FormField></div><Button>Simpan akun</Button></FormSection></DemoCard>
            </>}
            {activeCategory === 'data' && <>
              <DemoCard title="Card" description="Container untuk mengelompokkan konten dan aksi." className="span-2"><div className="demo-card-pair"><Card title="Ringkasan project" footer={<Button variant="outline" size="small">Lihat detail</Button>}><strong>Website perusahaan</strong><p className="ui-muted">Estimasi 12 jam · Diperbarui hari ini</p></Card><Card variant="outlined" header={<strong>Card outlined</strong>}><p>Varian border untuk konteks yang membutuhkan pemisahan.</p></Card></div></DemoCard>
              <DemoCard title="Table" description="Data dengan render cell, empty, loading, dan responsive handling." className="span-2"><div className="demo-table-toolbar"><SearchInput value={search} onChange={setSearch} placeholder="Cari nama fitur" aria-label="Cari nama fitur" /><Button size="small" leadingIcon={<span aria-hidden="true">+</span>}>Tambah fitur</Button></div><Table columns={catalogColumns} rows={filteredRows} getRowKey={row => row.name} caption="Katalog fitur contoh" emptyState={<div className="demo-empty-cell">Tidak ada fitur yang cocok.</div>} /><div className="demo-table-footer"><Pagination page={page} totalPages={3} onPageChange={setPage} /><span>12 data · Halaman {page}</span></div></DemoCard>
              <DemoCard title="Badge" description="Status teks memakai warna semantic dan label yang jelas."><div className="demo-badges">{(['default', 'success', 'warning', 'danger', 'info', 'neutral'] as BadgeVariant[]).map((variant, index) => <Badge variant={variant} key={variant}>{['Default', 'Aktif', 'Menunggu', 'Ditolak', 'Informasi', 'Arsip'][index]}</Badge>)}</div></DemoCard>
              <DemoCard title="Alert" description="Pesan status dengan ikon, judul, dan opsi dismiss." className="span-2"><div className="demo-alerts"><Alert variant="info" title="Informasi">Jadwal pemeliharaan malam ini pukul 23.00.</Alert><Alert variant="success" title="Berhasil">Data pelanggan sudah disimpan.</Alert><Alert variant="warning" title="Peringatan" onDismiss={() => toast.info('Peringatan ditutup.')}>Kuota penyimpanan hampir penuh.</Alert><Alert variant="error" title="Gagal">Koneksi ke server terputus.</Alert></div></DemoCard>
              <DemoCard title="Skeleton" description="Placeholder untuk konten yang sedang dimuat."><SkeletonCard /><div className="demo-skeleton-lines"><Skeleton variant="text" width="82%" /><Skeleton variant="text" width="62%" /><SkeletonTableRow columns={3} /></div></DemoCard>
              <DemoCard title="EmptyState" description="Pesan ramah saat daftar belum memiliki data."><EmptyState icon={<CalendarDays size={23} />} title="Belum ada project" description="Project baru akan tampil di sini setelah dibuat." action={<Button size="small">Buat project</Button>} /></DemoCard>
              <DemoCard title="ErrorState" description="Pesan error yang jelas dengan aksi coba lagi."><ErrorState title="Data tidak dapat dimuat" description="Periksa koneksi, lalu coba lagi." onRetry={() => toast.info('Permintaan dimuat ulang.')} /></DemoCard>
            </>}
            {activeCategory === 'interactive' && <>
              <DemoCard title="Toast" description="Notifikasi ringkas dengan auto dismiss dan aksi tutup." className="span-2"><div className="demo-row"><Button onClick={() => toast.success('Data berhasil disimpan.')}>Success</Button><Button variant="danger" onClick={() => toast.error('Terjadi kesalahan saat menyimpan.')}>Error</Button><Button variant="secondary" onClick={() => toast.warning('Periksa kembali data Anda.')}>Warning</Button><Button variant="outline" onClick={() => toast.info('Perubahan terakhir tersimpan.')}>Info</Button></div></DemoCard>
              <DemoCard title="Modal" description="Dialog native dengan Escape, backdrop, judul, dan footer."><Button onClick={() => setModalOpen(true)}>Buka modal</Button><Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Simpan perubahan?" description="Perubahan akan diterapkan pada konfigurasi project ini." footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button><Button onClick={() => { setModalOpen(false); toast.success('Perubahan disimpan.') }}>Simpan perubahan</Button></>}><p>Pastikan data yang dimasukkan sudah benar sebelum melanjutkan.</p></Modal></DemoCard>
              <DemoCard title="Drawer" description="Panel samping responsif dengan dukungan tombol Escape."><Button variant="outline" onClick={() => setDrawerOpen(true)}>Buka drawer</Button><Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Pengaturan cepat" description="Ubah detail tanpa meninggalkan halaman." footer={<Button onClick={() => setDrawerOpen(false)}>Selesai</Button>}><FormField label="Nama project" htmlFor="drawer-project"><Input id="drawer-project" defaultValue="Website perusahaan" /></FormField><FormField label="Catatan" htmlFor="drawer-note"><Textarea id="drawer-note" placeholder="Catatan tambahan" /></FormField></Drawer><p className="ui-muted demo-note">Modal dan drawer dapat ditutup dengan Esc.</p></DemoCard>
              <DemoCard title="Dropdown" description="Menu aksi dengan separator, disabled, dan aksi berbahaya."><Dropdown label="Aksi" items={[{ label: 'Edit', onSelect: () => toast.info('Aksi Edit dipilih.') }, { label: 'Duplikat', onSelect: () => toast.info('Aksi Duplikat dipilih.') }, { label: 'Tidak tersedia', disabled: true }, { label: 'Hapus', destructive: true, separator: true, onSelect: () => toast.warning('Aksi Hapus dipilih.') }]} /></DemoCard>
              <DemoCard title="Tabs" description="Navigasi tab dengan tombol panah, Home, dan End." className="span-2"><Tabs tabs={[{ id: 'summary', label: 'Ringkasan', content: <p>Total fitur katalog <strong>24</strong>, naik 6% dari bulan lalu.</p> }, { id: 'activity', label: 'Aktivitas', content: <p>3 perubahan dilakukan minggu ini oleh tim Anda.</p> }, { id: 'settings', label: 'Pengaturan', content: <p>Notifikasi project aktif dan ringkasan dikirim mingguan.</p> }]} /></DemoCard>
            </>}
            {activeCategory === 'navigation' && <>
              <DemoCard title="SearchInput" description="Input pencarian terkontrol dengan aksi hapus."><SearchInput value={search} onChange={setSearch} placeholder="Cari nama atau kategori" aria-label="Cari nama atau kategori" /><p className="ui-muted demo-note">{search ? `Pencarian: “${search}”` : 'Ketik untuk mencoba pencarian.'}</p></DemoCard>
              <DemoCard title="Pagination" description="Pilih halaman dengan boundary state yang dapat diakses."><Pagination page={page} totalPages={5} onPageChange={setPage} /><p className="ui-muted demo-note">Menampilkan halaman {page} dari 5.</p></DemoCard>
            </>}
          </div>
        </section>
        {activeCategory === 'forms' && <p className="showcase-footnote"><CircleHelp size={15} /> Semua field dapat digunakan sebagai controlled input dan memiliki focus state yang konsisten.</p>}
        {activeCategory === 'data' && <p className="showcase-footnote"><Check size={15} /> Contoh katalog fitur menggunakan data lokal showcase dan tidak mengirim request.</p>}
      </div>
    </main>
  </div>
}

function DemoCard({ title, description, className = '', children }: { title: string; description: string; className?: string; children: React.ReactNode }) {
  return <Card className={`showcase-demo-card ${className}`}><header className="showcase-demo-card__heading"><div><h3>{title}</h3><p>{description}</p></div><span className="showcase-demo-card__dots" aria-hidden="true">•••</span></header><div className="showcase-demo-card__preview">{children}</div></Card>
}
