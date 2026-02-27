import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const COLORS = {
  bg: '#08080f',
  surface: '#10101a',
  border: '#1e1e2e',
  cyan: '#00f0ff',
  violet: '#7b61ff',
  amber: '#ffb830',
  neutral: '#c8c8d8',
  white: '#e8e8f0',
  muted: '#555570',
  success: '#00c896',
  danger: '#ff4466',
  warmSurface: '#131008',
  coolSurface: '#0e0e18',
};

type Section = 'Tasks' | 'Ideas' | 'Frames' | 'Intern';
type Note = {
  id: string;
  text: string;
  done?: boolean;
  section: Section;
  createdAt: number;
  doneAt?: number;
  company?: string;
  role?: string;
  dateApplied?: string;
};

const SECTIONS: Section[] = ['Tasks', 'Ideas', 'Frames', 'Intern'];
const SECTION_META = {
  Tasks: { accent: COLORS.cyan, icon: '✦', label: 'TASKS', addLabel: '+ ADD', emptyMain: 'nothing here yet', emptySub: 'tap + ADD to drop something in', cardBg: COLORS.surface },
  Ideas: { accent: COLORS.violet, icon: '◈', label: 'IDEAS', addLabel: '+ ADD', emptyMain: 'no ideas yet', emptySub: 'tap + ADD to drop something in', cardBg: COLORS.surface },
  Frames: { accent: COLORS.amber, icon: '▶', label: 'FRAMES', addLabel: '+ SCENE', emptyMain: 'your next scene starts here', emptySub: 'every great video starts with a single frame', cardBg: COLORS.warmSurface },
  Intern: { accent: COLORS.neutral, icon: '⊞', label: 'INTERN', addLabel: '+ APPLY', emptyMain: 'no applications yet', emptySub: 'tap + APPLY to log your first application', cardBg: COLORS.coolSurface },
};

const EIGHTEEN_HOURS = 18 * 60 * 60 * 1000;

function SwipeableCard({ item, onDelete, onToggle, showCheckbox, accent, cardBg }: any) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(g.dx);
          deleteOpacity.setValue(Math.min(1, Math.abs(g.dx) / 80));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80) {
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => onDelete(item.id));
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          Animated.timing(deleteOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const isFrames = item.section === 'Frames';

  return (
    <View style={styles.swipeWrapper}>
      <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
        <Text style={styles.deleteText}>DELETE</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <View style={[styles.card, { borderLeftColor: accent, backgroundColor: cardBg }, isFrames && styles.framesCard]}>
          {isFrames && (
            <View style={styles.framesTopBar}>
              <Text style={styles.framesTopBarBlock}>■ </Text>
              <Text style={styles.framesTopBarLabel}>SCENE</Text>
            </View>
          )}
          {showCheckbox && (
            <TouchableOpacity onPress={() => onToggle(item.id)} style={styles.checkbox}>
              <View style={[styles.checkboxInner, item.done && { backgroundColor: COLORS.success, borderColor: COLORS.success }]}>
                {item.done && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.noteText, item.done && styles.doneText, isFrames && styles.framesNoteText]}>{item.text}</Text>
            {item.section !== 'Tasks' && !isFrames && (
              <Text style={styles.sectionTag}>{item.section}</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function InternCard({ item, onDelete }: any) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(g.dx);
          deleteOpacity.setValue(Math.min(1, Math.abs(g.dx) / 80));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -80) {
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => onDelete(item.id));
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          Animated.timing(deleteOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.swipeWrapper}>
      <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
        <Text style={styles.deleteText}>DELETE</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <View style={[styles.card, styles.internCard, { backgroundColor: COLORS.coolSurface }]}>
          <View style={styles.internHeader}>
            <Text style={styles.internCompany}>{item.company}</Text>
            <Text style={styles.internDate}>{item.dateApplied}</Text>
          </View>
          <Text style={styles.internRole}>{item.role}</Text>
          <View style={styles.internFooter}>
            <Text style={styles.internId}>{Math.floor((Date.now() - item.createdAt) / (1000 * 60 * 60 * 24)) === 0 ? 'today' : `${Math.floor((Date.now() - item.createdAt) / (1000 * 60 * 60 * 24))}d ago`}</Text>
            <Text style={styles.internApplied}>APPLIED</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<Section>('Tasks');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [internCompany, setInternCompany] = useState('');
  const [internRole, setInternRole] = useState('');
  const [internDate, setInternDate] = useState('');

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem('stash_notes');
      if (stored) {
        const parsed = JSON.parse(stored);
        const cleaned = parsed.filter((n: Note) =>
          !(n.section === 'Tasks' && n.done && n.doneAt && Date.now() - n.doneAt > EIGHTEEN_HOURS)
        );
        await AsyncStorage.setItem('stash_notes', JSON.stringify(cleaned));
        setNotes(cleaned);
      }
    } catch (e) {}
  };

  const saveNotes = async (updated: Note[]) => {
    setNotes(updated);
    await AsyncStorage.setItem('stash_notes', JSON.stringify(updated));
  };

  const addNote = async () => {
    if (activeTab === 'Intern') {
      if (!internCompany.trim() || !internRole.trim()) return;
      const newNote: Note = {
        id: Date.now().toString(),
        text: `${internCompany} — ${internRole}`,
        section: 'Intern',
        createdAt: Date.now(),
        company: internCompany.trim(),
        role: internRole.trim(),
        dateApplied: internDate.trim() || new Date().toLocaleDateString('en-GB'),
      };
      await saveNotes([...notes, newNote]);
      setInternCompany('');
      setInternRole('');
      setInternDate('');
      setModalVisible(false);
      return;
    }

    if (!inputText.trim()) return;
    const newNote: Note = {
      id: Date.now().toString(),
      text: inputText.trim(),
      done: false,
      section: activeTab,
      createdAt: Date.now(),
    };
    await saveNotes(activeTab === 'Frames' ? [...notes, newNote] : [newNote, ...notes]);
    setInputText('');
    setModalVisible(false);
  };

  const toggleDone = async (id: string) => {
    await saveNotes(notes.map(n =>
      n.id === id ? { ...n, done: !n.done, doneAt: !n.done ? Date.now() : undefined } : n
    ));
  };

  const deleteNote = async (id: string) => {
  const stored = await AsyncStorage.getItem('stash_notes');
  const current = stored ? JSON.parse(stored) : [];
  await saveNotes(current.filter((n: Note) => n.id !== id));
  };

  const isSearching = search.trim().length > 0;
  const filtered = isSearching
    ? notes.filter(n => n.text.toLowerCase().includes(search.toLowerCase()))
    : notes.filter(n => n.section === activeTab);

  const accent = SECTION_META[activeTab].accent;
  const meta = SECTION_META[activeTab];
  const isFramesTab = activeTab === 'Frames';
  const isInternTab = activeTab === 'Intern';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.logo}>STASH<Text style={{ color: accent }}>#</Text></Text>
        <Text style={styles.noteCount}>{notes.length} total</Text>
      </View>

      <View style={[styles.searchContainer, isFramesTab && { borderColor: COLORS.amber + '44' }, isInternTab && { borderColor: COLORS.neutral + '33' }]}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="search all notes..."
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
        />
        {isSearching && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: COLORS.muted, fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionHeader}>
        {isSearching ? (
          <Text style={[styles.sectionLabel, { color: COLORS.muted }]}>⌕ {filtered.length} RESULTS</Text>
        ) : (
          <Text style={[styles.sectionLabel, { color: accent }]}>{meta.icon} {meta.label}</Text>
        )}
        {!isSearching && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.addBtn, { borderColor: accent }]}>
            <Text style={[styles.addBtnText, { color: accent }]}>{meta.addLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) =>
          item.section === 'Intern' ? (
            <InternCard item={item} onDelete={deleteNote} />
          ) : (
            <SwipeableCard
              item={item}
              onDelete={deleteNote}
              onToggle={toggleDone}
              showCheckbox={item.section === 'Tasks'}
              accent={SECTION_META[item.section].accent}
              cardBg={SECTION_META[item.section].cardBg}
            />
          )
        }
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: accent }]}>{isSearching ? '⌕' : meta.icon}</Text>
            <Text style={styles.emptyText}>{isSearching ? 'no results found' : meta.emptyMain}</Text>
            <Text style={styles.emptySubtext}>{isSearching ? 'try a different keyword' : meta.emptySub}</Text>
          </View>
        }
      />

      <View style={styles.bottomNav}>
        {SECTIONS.map(s => (
          <TouchableOpacity key={s} onPress={() => { setActiveTab(s); setSearch(''); }} style={styles.navItem}>
            <Text style={[styles.navIcon, activeTab === s && { color: SECTION_META[s].accent }]}>{SECTION_META[s].icon}</Text>
            <Text style={[styles.navLabel, activeTab === s && { color: SECTION_META[s].accent }]}>{s}</Text>
            {activeTab === s && <View style={[styles.navIndicator, { backgroundColor: SECTION_META[s].accent }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, isFramesTab && { borderTopColor: COLORS.amber + '44' }, isInternTab && { borderTopColor: COLORS.neutral + '33' }]}>
            <View style={[styles.modalHandle, { backgroundColor: accent }]} />
            {isFramesTab && <Text style={styles.framesModalHint}>🎬 write your scene, script, or story idea</Text>}
            <Text style={[styles.modalTitle, { color: accent }]}>{meta.icon} new {activeTab.toLowerCase()}</Text>
            {isInternTab ? (
              <>
                <TextInput style={styles.modalInput} placeholder="Company name (e.g. Google)" placeholderTextColor={COLORS.muted} value={internCompany} onChangeText={setInternCompany} autoFocus />
                <TextInput style={styles.modalInput} placeholder="Role / Position (e.g. Data Science Intern)" placeholderTextColor={COLORS.muted} value={internRole} onChangeText={setInternRole} />
                <TextInput style={styles.modalInput} placeholder={`Date applied (e.g. ${new Date().toLocaleDateString('en-GB')})`} placeholderTextColor={COLORS.muted} value={internDate} onChangeText={setInternDate} />
              </>
            ) : (
              <TextInput
                style={[styles.modalInput, isFramesTab && { minHeight: 160 }]}
                placeholder={isFramesTab ? `INT. YOUR IMAGINATION - DAY\n\nWrite your scene here...` : `what's on your mind...`}
                placeholderTextColor={COLORS.muted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                autoFocus
              />
            )}
            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: accent }]} onPress={addNote}>
              <Text style={styles.confirmBtnText}>{isFramesTab ? '🎬 ACTION' : isInternTab ? '⊞ LOG IT' : 'STASH IT'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  logo: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 24, fontWeight: '800', color: COLORS.white, letterSpacing: 4 },
  noteCount: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: COLORS.muted },
  framesBanner: { backgroundColor: '#1a1200', paddingVertical: 8, paddingHorizontal: 16, marginBottom: 12 },
  framesBannerText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: COLORS.amber, letterSpacing: 2, opacity: 0.7 },
  internBanner: { backgroundColor: '#0d0d14', paddingVertical: 8, paddingHorizontal: 16, marginBottom: 12 },
  internBannerText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: COLORS.neutral, letterSpacing: 2, opacity: 0.7 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
  searchIcon: { color: COLORS.muted, fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.white, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, paddingVertical: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionLabel: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, fontWeight: '700', letterSpacing: 3 },
  addBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  swipeWrapper: { marginBottom: 10, marginHorizontal: 16 },
  deleteBackground: { position: 'absolute', right: 0, top: 0, bottom: 0, backgroundColor: COLORS.danger, borderRadius: 10, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20, width: '100%' },
  deleteText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: COLORS.white, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  card: { backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3, padding: 14, flexDirection: 'row', alignItems: 'flex-start' },
  framesCard: { flexDirection: 'column', borderColor: '#2a1f00' },
  framesTopBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, opacity: 0.5 },
  framesTopBarBlock: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 8, color: COLORS.amber, letterSpacing: 2 },
  framesTopBarLabel: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 8, color: COLORS.amber, letterSpacing: 3 },
  internCard: { flexDirection: 'column', borderLeftColor: COLORS.neutral, borderColor: '#1e1e2e' },
  internHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  internCompany: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 15, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  internDate: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: COLORS.muted, letterSpacing: 1 },
  internRole: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, color: COLORS.neutral, letterSpacing: 1, marginBottom: 10, opacity: 0.8 },
  internFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  internId: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: COLORS.muted },
  internApplied: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 9, color: COLORS.success, letterSpacing: 2, borderWidth: 1, borderColor: COLORS.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  checkbox: { marginRight: 12, marginTop: 2 },
  checkboxInner: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: COLORS.muted, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: COLORS.bg, fontSize: 11, fontWeight: '800' },
  noteText: { color: COLORS.white, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, lineHeight: 20 },
  framesNoteText: { color: '#f0d9a0', lineHeight: 22 },
  doneText: { color: COLORS.muted, textDecorationLine: 'line-through' },
  sectionTag: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: COLORS.muted, marginTop: 4, letterSpacing: 1 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  emptyText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: COLORS.muted, fontSize: 14, letterSpacing: 2, textAlign: 'center' },
  emptySubtext: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: COLORS.border, fontSize: 11, marginTop: 6, letterSpacing: 1, textAlign: 'center', lineHeight: 18 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 20, paddingTop: 12 },
  navItem: { flex: 1, alignItems: 'center', position: 'relative' },
  navIcon: { fontSize: 18, color: COLORS.muted, marginBottom: 4 },
  navLabel: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: COLORS.muted, letterSpacing: 2 },
  navIndicator: { position: 'absolute', bottom: -12, width: 30, height: 2, borderRadius: 1 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderTopWidth: 1, borderColor: COLORS.border },
  modalHandle: { width: 40, height: 3, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  framesModalHint: { fontSize: 11, color: COLORS.amber, opacity: 0.6, marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 1 },
  modalTitle: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, letterSpacing: 3, marginBottom: 16, fontWeight: '700' },
  modalInput: { backgroundColor: COLORS.bg, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 14, color: COLORS.white, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 14, minHeight: 50, textAlignVertical: 'top', marginBottom: 12 },
  confirmBtn: { borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4 },
  confirmBtnText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, fontWeight: '800', color: COLORS.bg, letterSpacing: 3 },
});
