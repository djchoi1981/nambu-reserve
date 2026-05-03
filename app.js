import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSyk8SUIMDGM9OHh6EciapPp3I7tyOH6o",
  authDomain: "nambooch-c4a73.firebaseapp.com",
  databaseURL: "https://nambooch-c4a73-default-rtdb.firebaseio.com", 
  projectId: "nambooch-c4a73",
  storageBucket: "nambooch-c4a73.firebasestorage.app",
  messagingSenderId: "168237220696",
  appId: "1:168237220696:web:c13440fbecd443dc20db2d",
  measurementId: "G-HG0Z1PV29Z"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Data states
let events = [];
let organization = [];
let menuNames = { committee: '위원회/부서 일정', cell: '셀/모임 장소예약', vehicle: '차량 운영예약' };
let adminPassword = '0191';

const defaultRooms = [
    '본당 1층 새벽기도실 1',
    '본당 1층 새벽기도실 2',
    '본당 3층 자모실',
    '교육관 3층 중보기도실',
    '교육관 3층 소그룹실',
    '비전센터 2층 당회실',
    '비전센터 3층 소망실',
    '비전센터 3층 사랑실'
];
let rooms = [];

const defaultVehicles = [
    '스타렉스 1호',
    '스타렉스 2호',
    '스타렉스 3호',
    '스타리아',
    '25인승 버스',
    '45인승 버스'
];
let vehicles = [];

let isDataLoaded = false;
let currentDate = new Date();

const defaultOrganization = [
    { id: 'c1', name: '예배드림위원회', departments: ['기획준비부', '예배운영·안내부', '예배미디어부', '성례성찬부'] },
    { id: 'c2', name: '찬양울림위원회', departments: ['성가대', '찬양단', '음악찬양단', '워십팀', '청년·청소년 찬양팀'] },
    { id: 'c3', name: '기도숨결·영성위원회', departments: ['중보기도부', '기도훈련부', '기도네트워크부'] },
    { id: 'c4', name: '교제·복지위원회', departments: ['행사역무부', '교제부', '샬롬케어·경조부', '세대소통·나눔부', '교인관리부'] },
    { id: 'c5', name: '교육위원회', departments: ['영아부', '유치부', '유·초등부', '중등부', '고등부', '청년1부', '청년2부', '여호수아부', '기독교교육부', '차세대교육혁신센터'] },
    { id: 'c6', name: '양육·훈련사역위원회', departments: ['제자훈련·리더십개발부', '성경·교리교육부', '시니어교육부', '입교·세례부'] },
    { id: 'c7', name: '만남·동행위원회', departments: ['남부전도단', '새가족환영부', '초기양육·정착부'] },
    { id: 'c8', name: '봉사·섬김위원회', departments: ['주방부', '워킹카페부', '성전돌봄부', '자원봉사자관리부'] },
    { id: 'c9', name: '문화·커뮤니케이션위원회', departments: ['문화·디자인부', '미디어홍보부', '사진부', '시니어부', 'Hope Touch부'] },
    { id: 'c10', name: '글로컬선교위원회', departments: ['국내·특수선교부', '지역사회·연대부', '이주·다문화선교부', '해외선교·후원부', '이단사이비대응·정보센터'] },
    { id: 'c11', name: '움직이는 교회사역 위원회', departments: ['프라이빗예배부', '멘토링부', '콘텐츠부', '위기개입부', '간증·리커버리부'] },
    { id: 'c12', name: '기획·행정위원회', departments: ['행정사무팀', '홍보부', '대외협력부', '기록예산부(겸)'] },
    { id: 'c13', name: '재정위원회', departments: ['재정수입부', '재정지출부', '감사부'] },
    { id: 'c14', name: '미래발전위원회', departments: ['비전·지역연구부', '차세대리더부', '기록아카이브부'] },
    { id: 'c15', name: '시설·안전·건축위원회', departments: ['시설관리부', '차량운행·배차', '주차부', '차량관리부', '안전부', '건축·자산관리부'] }
];

        
        
    let isLoggedIn = false;
    let currentEventIdForAction = null;

    // DOM Elements
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const todayBtn = document.getElementById('today-btn');
    const upcomingList = document.getElementById('upcoming-list-mini');
    const calendarFilter = document.getElementById('calendar-filter');
    
    // Navigation & Sections
    const navCalendar = document.getElementById('nav-calendar');
    const navCommittee = document.getElementById('nav-committee');
    const navCell = document.getElementById('nav-cell');
    const navVehicle = document.getElementById('nav-vehicle');
    const sidebarAdminBtn = document.getElementById('sidebar-admin-btn');
    const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
    
    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    const calendarSection = document.getElementById('calendar-view');
    const committeeSection = document.getElementById('committee-view');
    const cellSection = document.getElementById('cell-view');
    const vehicleSection = document.getElementById('vehicle-view');
    const adminSection = document.getElementById('admin-view');
    const registrationSection = document.getElementById('registration-section');
    
    const monthNavigation = document.querySelector('.month-navigation');
    const monthFilterLabel = document.getElementById('month-filter-label');
    const monthFilterCheckbox = document.getElementById('month-filter-checkbox');
    
    // Form & Common fields
    const form = document.getElementById('event-form');
    const currentEventTypeInput = document.getElementById('current-event-type');
    const formTitle = document.getElementById('form-title');
    const locationLabel = document.getElementById('location-label');
    const conflictAlert = document.getElementById('conflict-alert');
    const conflictMessage = document.getElementById('conflict-message');
    const toast = document.getElementById('toast');
    
    const dateInput = document.getElementById('date');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const unavailableTimesInfo = document.getElementById('unavailable-times-info');
    const locationSelect = document.getElementById('location-select');
    const locationInput = document.getElementById('location-input');
    const newRoomName = document.getElementById('new-room-name');
    const addRoomBtn = document.getElementById('add-room-btn');
    const adminRoomsList = document.getElementById('admin-rooms-list');
    const descriptionInput = document.getElementById('description');
    const eventPasswordInput = document.getElementById('event-password');
    const editEventIdInput = document.getElementById('edit-event-id');
    const submitEventBtn = document.getElementById('submit-event-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    
    // List Containers & Filters
    const committeeListContainer = document.getElementById('committee-list-container');
    const cellListContainer = document.getElementById('cell-list-container');
    const vehicleListContainer = document.getElementById('vehicle-list-container');
    
    const committeeSelect = document.getElementById('committee');
    const departmentSelect = document.getElementById('department');
    const filterCommittee = document.getElementById('filter-committee');
    const filterDepartment = document.getElementById('filter-department');
    
    const filterCellName = document.getElementById('filter-cell-name');
    const filterVehicle = document.getElementById('filter-vehicle');
    const newVehicleName = document.getElementById('new-vehicle-name');
    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    const adminVehiclesList = document.getElementById('admin-vehicles-list');
    const vehicleSelect = document.getElementById('vehicle');
    
    // Admin Master List & Menus
    const adminEventFilter = document.getElementById('admin-event-filter');
    const adminEventsContainer = document.getElementById('admin-events-container');

    // Modal
    const eventModal = document.getElementById('event-modal');
    const closeEventBtn = document.getElementById('close-event-btn');
    const eventDetailContent = document.getElementById('event-detail-content');
    const eventActionPassword = document.getElementById('event-action-password');
    const btnEditEvent = document.getElementById('btn-edit-event');
    const btnDeleteEvent = document.getElementById('btn-delete-event');
    const eventActionError = document.getElementById('event-action-error');

    // Day Events Modal
    const dayEventsModal = document.getElementById('day-events-modal');
    const closeDayEventsBtn = document.getElementById('close-day-events-btn');
    const dayEventsTitle = document.getElementById('day-events-title');
    const dayEventsList = document.getElementById('day-events-list');

    // Auth & Admin DOM
    
    
    
    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const loginPassword = document.getElementById('login-password');
    const submitLoginBtn = document.getElementById('submit-login-btn');
    const loginError = document.getElementById('login-error');
    const newCommitteeName = document.getElementById('new-committee-name');
    const addCommitteeBtn = document.getElementById('add-committee-btn');
    const orgManageContainer = document.getElementById('org-manage-container');
    const currentPassword = document.getElementById('current-password');
    const newPassword = document.getElementById('new-password');
    const changePwBtn = document.getElementById('change-pw-btn');
    const pwChangeMsg = document.getElementById('pw-change-msg');

    const todayStr = new Date().toISOString().split('T')[0];
    if(dateInput) dateInput.value = todayStr;

    // Listen to Firebase Data Changes
    const appDataRef = ref(db, 'churchApp');
    onValue(appDataRef, (snapshot) => {
        const data = snapshot.val() || {};
        
        // 1. Load Organization
        if(data.organization) {
            organization = data.organization;
        } else {
            organization = defaultOrganization;
            // Seed DB
            set(ref(db, 'churchApp/organization'), defaultOrganization);
        }
        
        // 2. Load Events
        if(data.events) {
            events = Object.values(data.events); // convert object back to array
        } else {
            events = [];
        }
        
        // 3. Load Menu Names
        if(data.menuNames) {
            menuNames = data.menuNames;
        } else {
            set(ref(db, 'churchApp/menuNames'), menuNames);
        }
        
        // 4. Load Admin Password
        if(data.adminPassword) {
            adminPassword = data.adminPassword;
        } else {
            set(ref(db, 'churchApp/adminPassword'), adminPassword);
        }

        // 5. Load Rooms
        if(data.rooms) {
            rooms = data.rooms;
        } else {
            rooms = defaultRooms;
            set(ref(db, 'churchApp/rooms'), defaultRooms);
        }

        // 6. Load Vehicles
        if(data.vehicles) {
            vehicles = data.vehicles;
        } else {
            vehicles = defaultVehicles;
            set(ref(db, 'churchApp/vehicles'), defaultVehicles);
        }

        isDataLoaded = true;
        
        // Re-render UI
        applyMenuNames();
        populateOrganizationOptions();
        populateRooms();
        populateVehicles();
        renderCalendar();
        renderUpcomingEvents();
        renderCommitteeList();
        renderCellList();
        renderVehicleList();
        if (isLoggedIn) {
            renderAdminOrgList();
        renderAdminRoomsList();
        renderAdminVehiclesList();
            renderAdminEventsList();
        }
    });

    function applyMenuNames() {
        document.querySelectorAll('.lbl-menu-committee').forEach(el => el.textContent = menuNames.committee);
        document.querySelectorAll('.lbl-menu-cell').forEach(el => el.textContent = menuNames.cell);
        document.querySelectorAll('.lbl-menu-vehicle').forEach(el => el.textContent = menuNames.vehicle);
        
        document.getElementById('opt-cal-committee').textContent = `${menuNames.committee}만`;
        document.getElementById('opt-cal-cell').textContent = `${menuNames.cell}만`;
        document.getElementById('opt-cal-vehicle').textContent = `${menuNames.vehicle}만`;
        
        document.getElementById('opt-adm-committee').textContent = `${menuNames.committee}만`;
        document.getElementById('opt-adm-cell').textContent = `${menuNames.cell}만`;
        document.getElementById('opt-adm-vehicle').textContent = `${menuNames.vehicle}만`;
        
        document.getElementById('admin-name-committee').value = menuNames.committee;
        document.getElementById('admin-name-cell').value = menuNames.cell;
        document.getElementById('admin-name-vehicle').value = menuNames.vehicle;
    }

    document.getElementById('save-menu-names-btn').addEventListener('click', () => {
        menuNames.committee = document.getElementById('admin-name-committee').value.trim() || '위원회/부서 일정';
        menuNames.cell = document.getElementById('admin-name-cell').value.trim() || '셀/모임 장소예약';
        menuNames.vehicle = document.getElementById('admin-name-vehicle').value.trim() || '차량 운영예약';
        set(ref(db, 'churchApp/menuNames'), menuNames);
        applyMenuNames();
        showToast("메뉴명이 저장되었습니다.");
        
        // Update current page title if active
        
        
        
    });

    // View Switching Logic
    function hideAllSections() {
        calendarSection.style.display = 'none';
        committeeSection.style.display = 'none';
        cellSection.style.display = 'none';
        vehicleSection.style.display = 'none';
        adminSection.style.display = 'none';
        calendarFilter.style.display = 'none';
        
        navCalendar.classList.remove('active');
        navCommittee.classList.remove('active');
        navCell.classList.remove('active');
        navVehicle.classList.remove('active');
        sidebarAdminBtn.classList.remove('active');
        
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        }
    }
    
    // Mobile Menu Toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('show');
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        });
    }
    
    function switchFormType(type) {
        currentEventTypeInput.value = type;
        document.getElementById('fields-committee').style.display = 'none';
        document.getElementById('fields-cell').style.display = 'none';
        document.getElementById('fields-vehicle').style.display = 'none';
        
        document.querySelectorAll('.type-fields input, .type-fields select').forEach(el => el.removeAttribute('required'));
        
        document.getElementById(`fields-${type}`).style.display = 'block';
        document.querySelectorAll(`#fields-${type} input, #fields-${type} select`).forEach(el => {
            // Do not make title-cell required
            if (el.id !== 'title-cell') {
                el.setAttribute('required', 'true');
            }
        });
        
        if (type === 'vehicle') {
            document.getElementById('location-container').style.order = '5';
            document.getElementById('location-container').style.display = 'none';
            locationSelect.removeAttribute('required');
            locationInput.removeAttribute('required');
            formTitle.innerHTML = `<i class="ph ph-calendar-plus"></i> ${menuNames.vehicle} 등록`;
        } else if (type === 'cell') {
            document.getElementById('location-container').style.display = 'block';
            document.getElementById('location-container').style.order = '-1';
            locationLabel.innerHTML = '예약 장소 <span class="required" style="color: var(--danger);">*</span>';
            locationSelect.style.display = 'block';
            locationSelect.setAttribute('required', 'true');
            if (locationSelect.value !== 'custom') {
                locationInput.style.display = 'none';
                locationInput.removeAttribute('required');
            } else {
                locationInput.style.display = 'block';
                locationInput.setAttribute('required', 'true');
            }
            locationInput.placeholder = "직접 입력 (예: 본당, 소예배실)";
            formTitle.innerHTML = `<i class="ph ph-calendar-plus"></i> ${menuNames.cell} 등록`;
        } else {
            document.getElementById('location-container').style.display = 'block';
            document.getElementById('location-container').style.order = '5';
            locationLabel.innerHTML = '장소 (선택)';
            locationSelect.style.display = 'block';
            locationSelect.removeAttribute('required');
            if (locationSelect.value !== 'custom') locationInput.style.display = 'none';
            locationInput.removeAttribute('required');
            locationInput.placeholder = "직접 입력 (예: 본당, 소예배실)";
            formTitle.innerHTML = `<i class="ph ph-calendar-plus"></i> ${menuNames.committee} 등록`;
        }
    }

    navCalendar.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        navCalendar.classList.add('active');
        calendarSection.style.display = 'block';
        registrationSection.style.display = 'none';
        calendarFilter.style.display = 'block';
        if (monthFilterLabel) monthFilterLabel.style.display = 'none';
        
        renderCalendar();
    });

    navCommittee.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        navCommittee.classList.add('active');
        committeeSection.style.display = 'block';
        registrationSection.style.display = 'block';
        if (monthFilterLabel) monthFilterLabel.style.display = 'flex';
        
        switchFormType('committee');
        renderCommitteeList();
    });

    navCell.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        navCell.classList.add('active');
        cellSection.style.display = 'block';
        registrationSection.style.display = 'block';
        if (monthFilterLabel) monthFilterLabel.style.display = 'flex';
        
        switchFormType('cell');
        renderCellList();
    });

    navVehicle.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        navVehicle.classList.add('active');
        vehicleSection.style.display = 'block';
        registrationSection.style.display = 'block';
        if (monthFilterLabel) monthFilterLabel.style.display = 'flex';
        
        switchFormType('vehicle');
        renderVehicleList();
    });

    sidebarAdminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            loginModal.style.display = 'flex';
            loginPassword.value = '';
            loginError.style.display = 'none';
            loginPassword.focus();
        } else {
            hideAllSections();
            sidebarAdminBtn.classList.add('active');
            adminSection.style.display = 'block';
            registrationSection.style.display = 'none';
            if (monthFilterLabel) monthFilterLabel.style.display = 'flex';
            renderAdminOrgList();
        renderAdminRoomsList();
        renderAdminVehiclesList();
            renderAdminEventsList();
        }
    });
    
    sidebarLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLoggedIn = false;
        sidebarLogoutBtn.style.display = 'none';
        sidebarAdminBtn.innerHTML = '<i class="ph ph-gear"></i> 관리자 모드';
        
        if (adminSection.style.display === 'block') {
            navCalendar.click();
        }
        showToast("로그아웃 되었습니다.");
    });
    // Swipe logic for Calendar
    let touchStartX = 0;
    let touchEndX = 0;

    calendarGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, {passive: true});

    calendarGrid.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleCalendarSwipe();
    }, {passive: true});

    function handleCalendarSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) {
            // Swiped left -> Next Month
            currentDate.setMonth(currentDate.getMonth() + 1);
            calendarGrid.classList.remove('slide-right', 'slide-left');
            void calendarGrid.offsetWidth;
            calendarGrid.classList.add('slide-left');
            renderCurrentView();
        } else if (touchEndX > touchStartX + threshold) {
            // Swiped right -> Prev Month
            currentDate.setMonth(currentDate.getMonth() - 1);
            calendarGrid.classList.remove('slide-right', 'slide-left');
            void calendarGrid.offsetWidth;
            calendarGrid.classList.add('slide-right');
            renderCurrentView();
        }
    }

    // Calendar Navigation & Filter
    function renderCurrentView() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        currentMonthDisplay.textContent = `${year}년 ${month + 1}월`;

        if (calendarSection.style.display === 'block' || calendarSection.style.display === '') renderCalendar();
        if (committeeSection.style.display === 'block') renderCommitteeList();
        if (cellSection.style.display === 'block') renderCellList();
        if (vehicleSection.style.display === 'block') renderVehicleList();
        if (adminSection.style.display === 'block' && isLoggedIn) renderAdminEventsList();
    }
    
    if (monthFilterCheckbox) {
        monthFilterCheckbox.addEventListener('change', renderCurrentView);
    }

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        calendarGrid.classList.remove('slide-right', 'slide-left');
        void calendarGrid.offsetWidth;
        calendarGrid.classList.add('slide-right');
        renderCurrentView();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        calendarGrid.classList.remove('slide-right', 'slide-left');
        void calendarGrid.offsetWidth;
        calendarGrid.classList.add('slide-left');
        renderCurrentView();
    });

    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCurrentView();
    });
    
    calendarFilter.addEventListener('change', renderCalendar);
    adminEventFilter.addEventListener('change', renderAdminEventsList);

    // Form Interactions
    locationSelect.addEventListener('change', () => {
        if (locationSelect.value === 'custom') {
            locationInput.style.display = 'block';
            locationInput.setAttribute('required', 'true');
            locationInput.value = '';
            locationInput.focus();
        } else {
            locationInput.style.display = 'none';
            locationInput.removeAttribute('required');
        }
        checkForConflicts(editEventIdInput.value !== '' ? editEventIdInput.value : null);
    });
    
    // Conflict detection listeners
    const triggerConflictCheck = () => checkForConflicts(editEventIdInput.value !== '' ? editEventIdInput.value : null);
    dateInput.addEventListener('change', triggerConflictCheck);
    startTimeInput.addEventListener('change', triggerConflictCheck);
    endTimeInput.addEventListener('change', triggerConflictCheck);
    locationInput.addEventListener('blur', triggerConflictCheck);
    document.getElementById('vehicle').addEventListener('change', triggerConflictCheck);
    committeeSelect.addEventListener('change', () => {
        const commId = committeeSelect.value;
        const org = organization.find(o => o.id === commId);
        departmentSelect.innerHTML = '<option value="" disabled selected>선택하세요</option>';
        if (org) {
            org.departments.forEach(dept => {
                departmentSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
            });
        }
    });

    filterCommittee.addEventListener('change', () => {
        const commId = filterCommittee.value;
        filterDepartment.innerHTML = '<option value="all">모든 부서 보기</option>';
        if (commId !== 'all') {
            const org = organization.find(o => o.id === commId);
            if (org) {
                org.departments.forEach(dept => {
                    filterDepartment.innerHTML += `<option value="${dept}">${dept}</option>`;
                });
            }
        }
        renderCommitteeList();
    });

    filterDepartment.addEventListener('change', renderCommitteeList);
    filterCellName.addEventListener('input', renderCellList);
    filterVehicle.addEventListener('change', renderVehicleList);

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const isEditMode = editEventIdInput.value !== '';
        const selectedType = currentEventTypeInput.value;
        
        if (checkForConflicts(isEditMode ? editEventIdInput.value : null)) {
            if (selectedType === 'cell' || selectedType === 'vehicle') {
                alert("해당 시간에 이미 예약된 일정이 있습니다. 겹치는 일정은 예약할 수 없습니다.");
                return;
            } else {
                const proceed = confirm("장소가 겹치는 다른 일정이 있습니다! 그래도 등록/수정하시겠습니까?");
                if (!proceed) return;
            }
        }
        
        
        let finalLocation = locationInput.value;
        if (selectedType !== 'vehicle') {
            if (locationSelect.value !== 'custom') {
                finalLocation = locationSelect.value;
            }
        }
        
        const newEvent = {
            id: isEditMode ? editEventIdInput.value : Date.now().toString(),
            eventType: selectedType,
            date: dateInput.value,
            startTime: startTimeInput.value,
            endTime: endTimeInput.value,
            location: finalLocation,
            description: descriptionInput.value,
            password: eventPasswordInput.value
        };

        if (selectedType === 'committee') {
            newEvent.committee = committeeSelect.value;
            newEvent.department = departmentSelect.value;
            newEvent.title = document.getElementById('title-committee').value;
        } else if (selectedType === 'cell') {
            newEvent.cellName = document.getElementById('cellName').value;
            newEvent.reserver = document.getElementById('reserver-cell').value;
            newEvent.title = document.getElementById('title-cell').value;
        } else if (selectedType === 'vehicle') {
            newEvent.vehicle = document.getElementById('vehicle').value;
            newEvent.reserver = document.getElementById('reserver-vehicle').value;
            newEvent.title = document.getElementById('title-vehicle').value;
        }

        if (isEditMode) {
            events = events.map(ev => ev.id === newEvent.id ? newEvent : ev);
            showToast("수정되었습니다.");
            exitEditMode();
        } else {
            events.push(newEvent);
            showToast("등록되었습니다.");
        }
        
        saveEvents();
        renderCalendar();
        renderUpcomingEvents();
        if(selectedType === 'committee') renderCommitteeList();
        else if(selectedType === 'cell') renderCellList();
        else if(selectedType === 'vehicle') renderVehicleList();
        if(isLoggedIn) renderAdminEventsList();
        
        form.reset();
        departmentSelect.innerHTML = '<option value="" disabled selected>위원회를 먼저 선택하세요</option>';
        dateInput.value = todayStr;
        conflictAlert.style.display = 'none';
        switchFormType(selectedType); // restore the form type
        
        // 자동 전환
        navCalendar.click();
        window.scrollTo(0, 0);
    });
    
    cancelEditBtn.addEventListener('click', exitEditMode);

    function exitEditMode() {
        editEventIdInput.value = '';
        submitEventBtn.textContent = '예약 등록하기';
        cancelEditBtn.style.display = 'none';
        form.reset();
        dateInput.value = new Date().toISOString().split('T')[0];
        const type = currentEventTypeInput.value;
        switchFormType(type);
    }

    function saveEvents() {
        // Firebase works best with objects instead of arrays. Let's convert array to object using id as key
        const eventsObj = {};
        events.forEach(e => { eventsObj[e.id] = e; });
        set(ref(db, 'churchApp/events'), eventsObj);
    }
    
    function saveOrganization() {
        set(ref(db, 'churchApp/organization'), organization);
    }

            function populateVehicles() {
        if(!filterVehicle || !vehicleSelect) return;
        filterVehicle.innerHTML = '<option value="all">모든 차량 보기</option>';
        vehicleSelect.innerHTML = '<option value="" disabled selected>선택하세요</option>';
        vehicles.forEach(veh => {
            filterVehicle.innerHTML += `<option value="${veh}">${veh}</option>`;
            vehicleSelect.innerHTML += `<option value="${veh}">${veh}</option>`;
        });
    }

    function populateRooms() {
        if(!locationSelect) return;
        locationSelect.innerHTML = '<option value="" disabled selected>장소를 선택하세요</option>';
        rooms.forEach(room => {
            locationSelect.innerHTML += `<option value="${room}">${room}</option>`;
        });
        locationSelect.innerHTML += `<option value="custom">기타 (직접 입력)</option>`;
    }

    function populateOrganizationOptions() {
        committeeSelect.innerHTML = '<option value="" disabled selected>선택하세요</option>';
        filterCommittee.innerHTML = '<option value="all">모든 위원회 보기</option>';
        
        organization.forEach(org => {
            committeeSelect.innerHTML += `<option value="${org.id}">${org.name}</option>`;
            filterCommittee.innerHTML += `<option value="${org.id}">${org.name}</option>`;
        });
        
        departmentSelect.innerHTML = '<option value="" disabled selected>위원회를 먼저 선택하세요</option>';
        filterDepartment.innerHTML = '<option value="all">모든 부서 보기</option>';
    }

    function getCommitteeName(id) {
        const org = organization.find(o => o.id === id);
        return org ? org.name : (id || '알 수 없음');
    }


    function showConfirm(title, message, onOk) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        const modal = document.getElementById('confirm-modal');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        
        modal.style.display = 'flex';
        
        // Remove old event listeners
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newCancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        newOkBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            onOk();
        });
    }

    // Modal Actions
    closeEventBtn.addEventListener('click', () => {
        eventModal.style.display = 'none';
    });
    
    btnDeleteEvent.addEventListener('click', () => {
        const ev = events.find(e => e.id === currentEventIdForAction);
        if(!ev) return;
        
        if (!isLoggedIn && eventActionPassword.value !== ev.password) {
            eventActionError.style.display = 'block';
            return;
        }
        
        showConfirm("일정 삭제", "정말로 이 일정을 삭제하시겠습니까?", () => {
            events = events.filter(e => e.id !== ev.id);
            saveEvents();
            renderCalendar();
            renderUpcomingEvents();
            renderCommitteeList();
            renderCellList();
            renderVehicleList();
            if(isLoggedIn) renderAdminEventsList();
            eventModal.style.display = 'none';
            showToast("삭제되었습니다.");
        });
    });

    if (closeDayEventsBtn) {
        closeDayEventsBtn.addEventListener('click', () => {
            dayEventsModal.style.display = 'none';
        });
    }

    btnEditEvent.addEventListener('click', () => {
        const ev = events.find(e => e.id === currentEventIdForAction);
        if(!ev) return;
        
        if (!isLoggedIn && eventActionPassword.value !== ev.password) {
            eventActionError.style.display = 'block';
            return;
        }
        
        eventModal.style.display = 'none';
        
        if (ev.eventType === 'committee') navCommittee.click();
        else if (ev.eventType === 'cell') navCell.click();
        else if (ev.eventType === 'vehicle') navVehicle.click();
        
        editEventIdInput.value = ev.id;
        dateInput.value = ev.date;
        startTimeInput.value = ev.startTime;
        endTimeInput.value = ev.endTime;
        if (ev.eventType === 'vehicle') {
            locationInput.value = ev.location;
        } else {
            if (rooms.includes(ev.location)) {
                locationSelect.value = ev.location;
                locationSelect.dispatchEvent(new Event('change'));
            } else {
                locationSelect.value = 'custom';
                locationSelect.dispatchEvent(new Event('change'));
                locationInput.value = ev.location;
            }
        }
        descriptionInput.value = ev.description;
        eventPasswordInput.value = ev.password;
        
        if (ev.eventType === 'committee') {
            committeeSelect.value = ev.committee;
            committeeSelect.dispatchEvent(new Event('change'));
            departmentSelect.value = ev.department;
            document.getElementById('title-committee').value = ev.title;
        } else if (ev.eventType === 'cell') {
            document.getElementById('cellName').value = ev.cellName;
            document.getElementById('reserver-cell').value = ev.reserver;
            document.getElementById('title-cell').value = ev.title;
        } else if (ev.eventType === 'vehicle') {
            document.getElementById('vehicle').value = ev.vehicle;
            document.getElementById('reserver-vehicle').value = ev.reserver;
            document.getElementById('title-vehicle').value = ev.title;
        }
        
        submitEventBtn.textContent = '수정된 내용 저장';
        cancelEditBtn.style.display = 'block';
        
        form.scrollIntoView({ behavior: 'smooth' });
    });

    function showEventDetails(ev) {
        currentEventIdForAction = ev.id;
        eventActionPassword.value = '';
        eventActionError.style.display = 'none';
        
        let typeStr = '';
        let titleStr = ev.title;
        let specificInfo = '';
        
        if(ev.eventType === 'committee') {
            typeStr = '<span style="background:var(--primary);color:#fff;padding:2px 6px;border-radius:4px;font-size:12px;">' + menuNames.committee + '</span>';
            specificInfo = `
                <p><strong>위원회:</strong> ${getCommitteeName(ev.committee)}</p>
                <p><strong>부서:</strong> ${ev.department}</p>
            `;
        } else if(ev.eventType === 'cell') {
            typeStr = '<span style="background:#10b981;color:#fff;padding:2px 6px;border-radius:4px;font-size:12px;">' + menuNames.cell + '</span>';
            specificInfo = `
                <p><strong>모임명:</strong> ${ev.cellName}</p>
                <p><strong>예약자:</strong> ${ev.reserver}</p>
            `;
        } else if(ev.eventType === 'vehicle') {
            typeStr = '<span style="background:#f59e0b;color:#fff;padding:2px 6px;border-radius:4px;font-size:12px;">' + menuNames.vehicle + '</span>';
            specificInfo = `
                <p><strong>배차차량:</strong> ${ev.vehicle}</p>
                <p><strong>예약자:</strong> ${ev.reserver}</p>
            `;
        }
        
        let locLabel = '장소';
        let locValue = ev.location || '미지정';
        if (ev.eventType === 'vehicle') locLabel = '목적지';
        
        eventDetailContent.innerHTML = `
            <div style="margin-bottom:1rem;">${typeStr}</div>
            <h4 style="margin-bottom:1rem; font-size:1.25rem;">${titleStr || '제목 없음'}</h4>
            <div style="background:var(--background); padding:1rem; border-radius:var(--radius-md); font-size:0.9rem; line-height:1.6;">
                ${specificInfo}
                <p><strong>일시:</strong> ${ev.date} ${ev.startTime} ~ ${ev.endTime}</p>
                <p><strong>${locLabel}:</strong> ${locValue}</p>
                ${ev.description ? `<p><strong>상세내용:</strong> ${ev.description}</p>` : ''}
            </div>
        `;
        
        if(isLoggedIn) {
            document.getElementById('event-action-auth').querySelector('p').style.display = 'none';
            eventActionPassword.style.display = 'none';
        } else {
            document.getElementById('event-action-auth').querySelector('p').style.display = 'block';
            eventActionPassword.style.display = 'block';
        }
        
        eventModal.style.display = 'flex';
    }

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        currentMonthDisplay.textContent = `${year}년 ${month + 1}월`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const startingDayOfWeek = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            createDayCell(prevMonthLastDay - i, true, new Date(year, month - 1, prevMonthLastDay - i));
        }

        const today = new Date();
        for (let i = 1; i <= totalDays; i++) {
            const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
            createDayCell(i, false, new Date(year, month, i), isToday);
        }

        const totalCellsCreated = startingDayOfWeek + totalDays;
        const remainingCells = (Math.ceil(totalCellsCreated / 7) * 7) - totalCellsCreated;
        for (let i = 1; i <= remainingCells; i++) {
            createDayCell(i, true, new Date(year, month + 1, i));
        }
    }

    function createDayCell(day, isOtherMonth, dateObj, isToday = false) {
        const cell = document.createElement('div');
        cell.className = `calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        cell.appendChild(dayNumber);

        const dateString = formatLocalISODate(dateObj);
        
        let dayEvents = events.filter(e => e.date === dateString);
        
        const calFilterVal = calendarFilter.value;
        if(calFilterVal !== 'all') {
            dayEvents = dayEvents.filter(e => e.eventType === calFilterVal);
        }
        
        dayEvents.sort((a, b) => a.startTime.localeCompare(b.startTime));

        const eventsContainer = document.createElement('div');
        eventsContainer.style.display = 'flex';
        eventsContainer.style.flexDirection = 'column';
        eventsContainer.style.gap = '3px';
        eventsContainer.style.marginTop = '4px';

        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'event-dot-container';

        dayEvents.forEach(e => {
            const tag = document.createElement('div');
            tag.className = `event-tag`;
            
            const dot = document.createElement('div');
            dot.className = `event-dot`;
            
            let icon = '';
            let label = '';
            
            if(e.eventType === 'committee') {
                const color = getCommitteeColor(e.committee);
                tag.style.backgroundColor = color;
                dot.style.backgroundColor = color;
                icon = '<i class="ph ph-users-three"></i>';
                label = `${e.department}`;
            } else if(e.eventType === 'cell') {
                tag.style.backgroundColor = '#10b981';
                dot.style.backgroundColor = '#10b981';
                icon = '<i class="ph ph-users"></i>';
                label = `${e.location}(${e.cellName})`;
            } else if(e.eventType === 'vehicle') {
                tag.style.backgroundColor = '#f59e0b';
                dot.style.backgroundColor = '#f59e0b';
                icon = '<i class="ph ph-car"></i>';
                label = `${e.vehicle}(${e.title})`;
            }
            
            tag.style.color = '#fff';
            tag.title = `${e.title || '제목 없음'} (${e.startTime} ~ ${e.endTime})`;
            tag.innerHTML = `<span>${e.startTime}</span> ${icon} ${label}`;
            
            tag.style.cursor = 'pointer';
            tag.addEventListener('click', (ev) => {
                ev.stopPropagation();
                showEventDetails(e);
            });
            
            eventsContainer.appendChild(tag);
            dotsContainer.appendChild(dot);
        });

        cell.appendChild(eventsContainer);
        cell.appendChild(dotsContainer);
        
        cell.addEventListener('click', () => {
            if (window.innerWidth <= 768 && dayEvents.length > 0) {
                showDayEventsModal(dateString, dayEvents);
            }
        });
        
        calendarGrid.appendChild(cell);
    }

    function formatLocalISODate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function showDayEventsModal(dateStr, dayEvents) {
        dayEventsTitle.textContent = `${dateStr} 일정`;
        dayEventsList.innerHTML = '';
        
        dayEvents.forEach(e => {
            const item = document.createElement('div');
            item.className = 'mini-event';
            item.style.cursor = 'pointer';
            
            let typeColor = '';
            let typeName = '';
            let displayTitle = e.title || '제목 없음';
            
            if (e.eventType === 'committee') { 
                typeColor = getCommitteeColor(e.committee); 
                typeName = menuNames.committee; 
            }
            else if (e.eventType === 'cell') { 
                typeColor = '#10b981'; 
                typeName = menuNames.cell; 
                displayTitle = `${e.location}(${e.cellName})`;
            }
            else if (e.eventType === 'vehicle') { 
                typeColor = '#f59e0b'; 
                typeName = menuNames.vehicle; 
                displayTitle = `${e.vehicle}(${e.title})`;
            }
            
            item.style.borderLeftColor = typeColor;
            
            item.innerHTML = `
                <h4 style="margin-bottom: 0.2rem;">${displayTitle}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);"><span style="color:${typeColor};font-weight:600;">${typeName}</span> | ${e.startTime} ~ ${e.endTime}</p>
            `;
            
            item.addEventListener('click', () => {
                dayEventsModal.style.display = 'none';
                showEventDetails(e);
            });
            
            dayEventsList.appendChild(item);
        });
        
        dayEventsModal.style.display = 'flex';
    }

    function renderUpcomingEvents() {
        upcomingList.innerHTML = '';
        
        const todayStr = formatLocalISODate(new Date());
        
        const upcoming = events
            .filter(e => e.date >= todayStr)
            .sort((a, b) => {
                if(a.date !== b.date) return a.date.localeCompare(b.date);
                return a.startTime.localeCompare(b.startTime);
            })
            .slice(0, 5);

        if (upcoming.length === 0) {
            upcomingList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">예정된 일정이 없습니다.</p>';
            return;
        }

        upcoming.forEach(e => {
            const item = document.createElement('div');
            item.className = 'mini-event';
            
            const [, mm, dd] = e.date.split('-');
            const formattedDate = `${parseInt(mm)}/${parseInt(dd)}`;
            
            let label = '';
            if(e.eventType === 'committee') label = `[${getCommitteeName(e.committee)}] ${e.department}`;
            else if(e.eventType === 'cell') label = `[${menuNames.cell}] ${e.cellName}`;
            else if(e.eventType === 'vehicle') label = `[${menuNames.vehicle}] ${e.vehicle}`;
            
            item.innerHTML = `
                <h4 style="cursor:pointer;" class="clickable-title" data-id="${e.id}">${e.title || '제목 없음'}</h4>
                <p><i class="ph ph-calendar"></i> ${formattedDate} ${e.startTime} | ${label}</p>
            `;
            
            upcomingList.appendChild(item);
        });
        
        document.querySelectorAll('.clickable-title').forEach(el => {
            el.addEventListener('click', (ev) => {
                const id = ev.target.getAttribute('data-id');
                const eventObj = events.find(x => x.id === id);
                if(eventObj) showEventDetails(eventObj);
            });
        });
    }

    function checkForConflicts(excludeId = null) {
        const date = dateInput.value;
        const start = startTimeInput.value;
        const end = endTimeInput.value;
        const type = currentEventTypeInput.value;
        let loc = locationInput.value;
        if (type !== 'vehicle' && locationSelect.value !== 'custom') {
            loc = locationSelect.value;
        } 
        
        const targetResource = type === 'vehicle' ? document.getElementById('vehicle').value : loc;

        if (!date || !start || !end || !targetResource) {
            conflictAlert.style.display = 'none';
            return false;
        }

        const conflictingEvents = events.filter(e => {
            if (e.id === excludeId) return false;
            if (e.date !== date) return false;
            
            if (type === 'vehicle') {
                if (e.eventType !== 'vehicle') return false; 
                if (e.vehicle !== targetResource) return false; 
            } else {
                if (e.eventType === 'vehicle') return false; 
                if (!e.location || e.location !== targetResource) return false; 
            }
            
            return (start < e.endTime) && (end > e.startTime);
        });

        if (conflictingEvents.length > 0) {
            conflictAlert.style.display = 'flex';
            const conflict = conflictingEvents[0];
            let label = conflict.eventType === 'vehicle' ? `차량(${conflict.vehicle})` : `해당 장소`;
            let owner = conflict.eventType === 'committee' ? `[${getCommitteeName(conflict.committee)}] ${conflict.department}` :
                        conflict.eventType === 'cell' ? `[${menuNames.cell}] ${conflict.cellName}` :
                        `${conflict.reserver}님`;
            
            conflictMessage.innerHTML = `${label}에 이미 <strong>${owner}</strong>의 <strong>[${conflict.title || '일정'}]</strong> 일정이 있습니다.<br>(${conflict.startTime} ~ ${conflict.endTime})`;
            return true;
        } else {
            conflictAlert.style.display = 'none';
            return false;
        }
    }

    function showToast(message) {
        document.getElementById('toast-message').textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    function renderCommitteeList() {
        if (!committeeListContainer) return;
        
        const filterC = filterCommittee.value;
        const filterD = filterDepartment.value;
        const targetMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        let filteredEvents = events.filter(e => e.eventType === 'committee');
        if (monthFilterCheckbox && monthFilterCheckbox.checked) {
            filteredEvents = filteredEvents.filter(e => e.date.startsWith(targetMonthStr));
        }
        
        if (filterC !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.committee === filterC);
        }
        if (filterD !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.department === filterD);
        }

        filteredEvents.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });

        committeeListContainer.innerHTML = '';

        if (filteredEvents.length === 0) {
            committeeListContainer.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    등록된 일정이 없습니다.
                </div>
            `;
            return;
        }

        filteredEvents.forEach(e => {
            const item = document.createElement('div');
            item.className = 'department-item';
            item.style.borderLeftColor = getCommitteeColor(e.committee);
            
            item.innerHTML = `
                <div class="dept-item-info">
                    <h4 style="cursor:pointer;" class="list-title" data-id="${e.id}">${e.title}</h4>
                </div>
                <div class="dept-item-meta">
                    <span><i class="ph ph-calendar"></i> ${e.date}</span>
                    <span><i class="ph ph-clock"></i> ${e.startTime} ~ ${e.endTime}</span>
                    <span><i class="ph ph-map-pin"></i> ${e.location}</span>
                    <span style="color: var(--primary); font-weight: 500; margin-left: auto;">[${getCommitteeName(e.committee)}] ${e.department}</span>
                </div>
            `;
            committeeListContainer.appendChild(item);
        });
        
        document.querySelectorAll('.list-title').forEach(el => {
            el.addEventListener('click', (ev) => {
                const id = ev.target.getAttribute('data-id');
                const eventObj = events.find(x => x.id === id);
                if(eventObj) showEventDetails(eventObj);
            });
        });
    }

    function renderCellList() {
        if (!cellListContainer) return;
        
        const filterVal = filterCellName.value.toLowerCase();
        const targetMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        let filteredEvents = events.filter(e => e.eventType === 'cell');
        if (monthFilterCheckbox && monthFilterCheckbox.checked) {
            filteredEvents = filteredEvents.filter(e => e.date.startsWith(targetMonthStr));
        }
        
        if (filterVal) {
            filteredEvents = filteredEvents.filter(e => e.cellName.toLowerCase().includes(filterVal));
        }

        filteredEvents.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });

        cellListContainer.innerHTML = '';

        if (filteredEvents.length === 0) {
            cellListContainer.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    등록된 예약이 없습니다.
                </div>
            `;
            return;
        }

        filteredEvents.forEach(e => {
            const item = document.createElement('div');
            item.className = 'department-item';
            item.style.borderLeftColor = '#10b981';
            
            item.innerHTML = `
                <div class="dept-item-info">
                    <h4 style="cursor:pointer;" class="list-title" data-id="${e.id}">${e.title || '제목 없음'}</h4>
                </div>
                <div class="dept-item-meta">
                    <span><i class="ph ph-calendar"></i> ${e.date}</span>
                    <span><i class="ph ph-clock"></i> ${e.startTime} ~ ${e.endTime}</span>
                    <span style="color: #10b981; font-weight: 500;"><i class="ph ph-map-pin"></i> 장소: ${e.location}</span>
                    <span style="margin-left: auto;">[${menuNames.cell}] ${e.cellName} (${e.reserver})</span>
                </div>
            `;
            cellListContainer.appendChild(item);
        });
        
        document.querySelectorAll('.list-title').forEach(el => {
            el.addEventListener('click', (ev) => {
                const id = ev.target.getAttribute('data-id');
                const eventObj = events.find(x => x.id === id);
                if(eventObj) showEventDetails(eventObj);
            });
        });
    }

    function renderVehicleList() {
        if (!vehicleListContainer) return;
        
        const filterVal = filterVehicle.value;
        const targetMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        let filteredEvents = events.filter(e => e.eventType === 'vehicle');
        if (monthFilterCheckbox && monthFilterCheckbox.checked) {
            filteredEvents = filteredEvents.filter(e => e.date.startsWith(targetMonthStr));
        }
        
        if (filterVal !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.vehicle === filterVal);
        }

        filteredEvents.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
        });

        vehicleListContainer.innerHTML = '';

        if (filteredEvents.length === 0) {
            vehicleListContainer.innerHTML = `
                <div class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    등록된 차량 배차 예약이 없습니다.
                </div>
            `;
            return;
        }

        filteredEvents.forEach(e => {
            const item = document.createElement('div');
            item.className = 'department-item';
            item.style.borderLeftColor = '#f59e0b';
            
            item.innerHTML = `
                <div class="dept-item-info">
                    <h4 style="cursor:pointer;" class="list-title" data-id="${e.id}">${e.title}</h4>
                </div>
                <div class="dept-item-meta">
                    <span><i class="ph ph-calendar"></i> ${e.date}</span>
                    <span><i class="ph ph-clock"></i> ${e.startTime} ~ ${e.endTime}</span>
                    <span style="margin-left: auto;">[${menuNames.vehicle}] ${e.vehicle} (${e.reserver})</span>
                </div>
            `;
            vehicleListContainer.appendChild(item);
        });
        
        document.querySelectorAll('.list-title').forEach(el => {
            el.addEventListener('click', (ev) => {
                const id = ev.target.getAttribute('data-id');
                const eventObj = events.find(x => x.id === id);
                if(eventObj) showEventDetails(eventObj);
            });
        });
    }

    function getCommitteeColor(commId) {
        if(!commId) return 'var(--border)';
        const palette = ['#4338ca', '#15803d', '#a16207', '#be123c', '#7e22ce', '#0369a1', '#c2410c', '#be185d', '#e11d48', '#d97706', '#65a30d', '#0891b2', '#4f46e5', '#9333ea', '#c026d3'];
        let hash = 0;
        for (let i = 0; i < commId.length; i++) {
            hash = commId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return palette[Math.abs(hash) % palette.length];
    }

    // Admin Master Event List Function
    function renderAdminEventsList() {
        if(!adminEventsContainer) return;
        
        const filterVal = adminEventFilter.value;
        const targetMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        
        let filteredEvents = events;
        if (monthFilterCheckbox && monthFilterCheckbox.checked) {
            filteredEvents = filteredEvents.filter(e => e.date.startsWith(targetMonthStr));
        }
        
        if (filterVal !== 'all') {
            filteredEvents = events.filter(e => e.eventType === filterVal);
        }
        
        // Sort newest first or by date
        filteredEvents.sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return b.startTime.localeCompare(a.startTime);
        });
        
        adminEventsContainer.innerHTML = '';
        
        if (filteredEvents.length === 0) {
            adminEventsContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                    예약된 일정이 없습니다.
                </div>
            `;
            return;
        }
        
        filteredEvents.forEach(e => {
            const item = document.createElement('div');
            item.className = 'department-item';
            
            let color = '';
            let owner = '';
            
            if(e.eventType === 'committee') {
                color = getCommitteeColor(e.committee);
                owner = `[${getCommitteeName(e.committee)}] ${e.department}`;
            } else if(e.eventType === 'cell') {
                color = '#10b981';
                owner = `[${menuNames.cell}] ${e.cellName} (${e.reserver})`;
            } else if(e.eventType === 'vehicle') {
                color = '#f59e0b';
                owner = `[${menuNames.vehicle}] ${e.vehicle} (${e.reserver})`;
            }
            
            item.style.borderLeftColor = color;
            item.style.backgroundColor = '#fff';
            
            item.innerHTML = `
                <div class="dept-item-info">
                    <h4>${e.title || '제목 없음'}</h4>
                </div>
                <div class="dept-item-meta" style="align-items: center;">
                    <span><i class="ph ph-calendar"></i> ${e.date}</span>
                    <span><i class="ph ph-clock"></i> ${e.startTime} ~ ${e.endTime}</span>
                    <span style="font-weight: 500;">${owner}</span>
                    
                    <div style="margin-left: auto; display: flex; gap: 0.5rem;">
                        <button type="button" class="btn btn-sm btn-outline admin-edit-btn" data-id="${e.id}">수정</button>
                        <button type="button" class="btn btn-sm btn-danger admin-delete-btn" data-id="${e.id}">삭제</button>
                    </div>
                </div>
            `;
            adminEventsContainer.appendChild(item);
        });
        
        document.querySelectorAll('.admin-edit-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const id = ev.target.getAttribute('data-id');
                const eventObj = events.find(x => x.id === id);
                if(eventObj) {
                    currentEventIdForAction = id;
                    btnEditEvent.click(); // Trigger edit flow
                }
            });
        });
        
        document.querySelectorAll('.admin-delete-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                const id = ev.target.getAttribute('data-id');
                showConfirm("예약 강제 삭제", "정말로 이 예약을 강제 삭제하시겠습니까? (관리자 권한)", () => {
                    events = events.filter(e => e.id !== id);
                    saveEvents();
                    renderAdminEventsList();
                    renderCalendar();
                    renderUpcomingEvents();
                    showToast("삭제되었습니다.");
                });
            });
        });
    }

    // Auth & Admin Logic
    
    
    closeLoginBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
    
    submitLoginBtn.addEventListener('click', () => {
        if(loginPassword.value === adminPassword) {
            isLoggedIn = true;
            loginModal.style.display = 'none';
            
            sidebarAdminBtn.innerHTML = '<i class="ph ph-gear"></i> 관리자 설정 (마스터)';
            sidebarLogoutBtn.style.display = 'block';
            
            showToast("관리자로 로그인되었습니다.");
            
            // automatically click admin btn to open it
            sidebarAdminBtn.click();
            
            const pElem = document.getElementById('event-action-auth').querySelector('p');
            if(pElem) pElem.style.display = 'none';
            eventActionPassword.style.display = 'none';
            
        } else {
            loginError.style.display = 'block';
        }
    });
    
    
    
    changePwBtn.addEventListener('click', () => {
        const curr = currentPassword.value;
        const nw = newPassword.value;
        
        if(curr !== adminPassword) {
            pwChangeMsg.textContent = "현재 비밀번호가 일치하지 않습니다.";
            pwChangeMsg.style.color = "var(--danger)";
            pwChangeMsg.style.display = "block";
            return;
        }
        
        if(nw.length < 4) {
            pwChangeMsg.textContent = "새 비밀번호는 4자리 이상이어야 합니다.";
            pwChangeMsg.style.color = "var(--danger)";
            pwChangeMsg.style.display = "block";
            return;
        }
        
        adminPassword = nw;
        set(ref(db, 'churchApp/adminPassword'), adminPassword);
        pwChangeMsg.textContent = "비밀번호가 성공적으로 변경되었습니다.";
        pwChangeMsg.style.color = "var(--success)";
        pwChangeMsg.style.display = "block";
        currentPassword.value = '';
        newPassword.value = '';
        
        setTimeout(() => { pwChangeMsg.style.display = 'none'; }, 3000);
    });

    addCommitteeBtn.addEventListener('click', () => {
        const name = newCommitteeName.value.trim();
        if(name) {
            const exists = organization.find(o => o.name === name);
            if(!exists) {
                organization.push({
                    id: 'c' + Date.now(),
                    name: name,
                    departments: []
                });
                saveOrganization();
                populateOrganizationOptions();
        populateRooms();
        populateVehicles();
                renderAdminOrgList();
        renderAdminRoomsList();
        renderAdminVehiclesList();
                newCommitteeName.value = '';
                showToast("위원회가 추가되었습니다.");
            } else {
                alert('이미 존재하는 위원회입니다.');
            }
        }
    });

            function renderAdminVehiclesList() {
        if(!adminVehiclesList) return;
        adminVehiclesList.innerHTML = '';
        vehicles.forEach((veh, idx) => {
            const li = document.createElement('li');
            li.className = 'org-dept-item';
            li.innerHTML = `
                ${veh}
                <button type="button" class="delete-vehicle-btn" data-index="${idx}" title="삭제"><i class="ph ph-x"></i></button>
            `;
            adminVehiclesList.appendChild(li);
        });
        
        document.querySelectorAll('.delete-vehicle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                showConfirm("차량 삭제", `'${vehicles[idx]}' 항목을 삭제하시겠습니까?`, () => {
                    vehicles.splice(idx, 1);
                    set(ref(db, 'churchApp/vehicles'), vehicles);
                    showToast("차량이 삭제되었습니다.");
                });
            });
        });
    }

    if(addVehicleBtn) {
        addVehicleBtn.addEventListener('click', () => {
            const name = newVehicleName.value.trim();
            if(name) {
                if(!vehicles.includes(name)) {
                    vehicles.push(name);
                    set(ref(db, 'churchApp/vehicles'), vehicles);
                    newVehicleName.value = '';
                    showToast("차량이 추가되었습니다.");
                } else {
                    alert('이미 존재하는 차량입니다.');
                }
            }
        });
    }

    function renderAdminRoomsList() {
        if(!adminRoomsList) return;
        adminRoomsList.innerHTML = '';
        rooms.forEach((room, idx) => {
            const li = document.createElement('li');
            li.className = 'org-dept-item';
            li.innerHTML = `
                ${room}
                <button type="button" class="delete-room-btn" data-index="${idx}" title="삭제"><i class="ph ph-x"></i></button>
            `;
            adminRoomsList.appendChild(li);
        });
        
        document.querySelectorAll('.delete-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                showConfirm("장소 삭제", `'${rooms[idx]}' 항목을 삭제하시겠습니까?`, () => {
                    rooms.splice(idx, 1);
                    set(ref(db, 'churchApp/rooms'), rooms);
                    showToast("장소가 삭제되었습니다.");
                });
            });
        });
    }

    addRoomBtn.addEventListener('click', () => {
        const name = newRoomName.value.trim();
        if(name) {
            if(!rooms.includes(name)) {
                rooms.push(name);
                set(ref(db, 'churchApp/rooms'), rooms);
                newRoomName.value = '';
                showToast("장소가 추가되었습니다.");
            } else {
                alert('이미 존재하는 장소입니다.');
            }
        }
    });

    function renderAdminOrgList() {
        orgManageContainer.innerHTML = '';
        organization.forEach((org, orgIndex) => {
            const card = document.createElement('div');
            card.className = 'org-committee-card';
            
            const header = document.createElement('div');
            header.className = 'org-committee-header';
            header.innerHTML = `
                <span class="org-committee-title">${org.name}</span>
                <button type="button" class="btn btn-sm btn-danger delete-comm-btn" data-index="${orgIndex}">위원회 삭제</button>
            `;
            card.appendChild(header);
            
            const deptList = document.createElement('ul');
            deptList.className = 'org-dept-list';
            org.departments.forEach((dept, deptIndex) => {
                const item = document.createElement('li');
                item.className = 'org-dept-item';
                item.innerHTML = `
                    ${dept}
                    <button type="button" class="delete-subdept-btn" data-org="${orgIndex}" data-dept="${deptIndex}" title="삭제"><i class="ph ph-x"></i></button>
                `;
                deptList.appendChild(item);
            });
            card.appendChild(deptList);
            
            const addForm = document.createElement('div');
            addForm.className = 'add-dept-inline-form';
            addForm.innerHTML = `
                <input type="text" placeholder="새 부서 추가" id="new-dept-input-${orgIndex}">
                <button type="button" class="btn btn-outline add-subdept-btn" data-org="${orgIndex}">추가</button>
            `;
            card.appendChild(addForm);
            
            orgManageContainer.appendChild(card);
        });
        
        document.querySelectorAll('.delete-comm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orgIdx = e.target.getAttribute('data-index');
                const orgName = organization[orgIdx].name;
                showConfirm("위원회 삭제", `'${orgName}'와 그 안의 모든 부서를 정말 삭제하시겠습니까?`, () => {
                    organization.splice(orgIdx, 1);
                    saveOrganization();
                    populateOrganizationOptions();
        populateRooms();
        populateVehicles();
                    renderAdminOrgList();
        renderAdminRoomsList();
        renderAdminVehiclesList();
                    showToast("위원회가 삭제되었습니다.");
                });
            });
        });
        
        document.querySelectorAll('.delete-subdept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnEl = e.currentTarget; 
                const orgIdx = btnEl.getAttribute('data-org');
                const deptIdx = btnEl.getAttribute('data-dept');
                showConfirm("부서 삭제", `이 부서를 삭제하시겠습니까?`, () => {
                    organization[orgIdx].departments.splice(deptIdx, 1);
                    saveOrganization();
                    populateOrganizationOptions();
        populateRooms();
        populateVehicles();
                    renderAdminOrgList();
        renderAdminRoomsList();
        renderAdminVehiclesList();
                    showToast("부서가 삭제되었습니다.");
                });
            });
        });
        
        document.querySelectorAll('.add-subdept-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orgIdx = e.target.getAttribute('data-org');
                const inputEl = document.getElementById(`new-dept-input-${orgIdx}`);
                const deptName = inputEl.value.trim();
                if(deptName) {
                    if(!organization[orgIdx].departments.includes(deptName)) {
                        organization[orgIdx].departments.push(deptName);
                        saveOrganization();
                        populateOrganizationOptions();
        populateRooms();
        populateVehicles();
                        renderAdminOrgList();
        renderAdminRoomsList();
        renderAdminVehiclesList();
                        showToast("부서가 추가되었습니다.");
                    } else {
                        alert("이미 존재하는 부서입니다.");
                    }
                }
            });
        });
    }

    function updateTimeAvailability() {
        const type = currentEventTypeInput.value;
        const date = dateInput.value;
        
        if (!date) {
            unavailableTimesInfo.style.display = 'none';
            return;
        }
        
        let locationOrVehicle = '';
        if (type === 'vehicle') {
            locationOrVehicle = vehicleSelect.value;
        } else {
            locationOrVehicle = locationSelect.value === 'custom' ? locationInput.value : locationSelect.value;
        }
        
        if (!locationOrVehicle) {
            unavailableTimesInfo.style.display = 'none';
            return;
        }
        
        const conflictingEvents = events.filter(e => {
            if (e.date !== date) return false;
            if (editEventIdInput.value && e.id === editEventIdInput.value) return false;
            
            if (type === 'vehicle') {
                return e.eventType === 'vehicle' && e.vehicle === locationOrVehicle;
            } else {
                return (e.eventType === 'committee' || e.eventType === 'cell') && e.location === locationOrVehicle;
            }
        });
        
        if (conflictingEvents.length > 0) {
            const timeList = conflictingEvents.map(e => `${e.startTime}~${e.endTime}`).join(', ');
            unavailableTimesInfo.innerHTML = `🚫 <b>해당 날짜 예약 불가 시간:</b><br>${timeList}`;
            unavailableTimesInfo.style.display = 'block';
        } else {
            unavailableTimesInfo.style.display = 'none';
        }
        
        // Validation on current input values
        const start = startTimeInput.value;
        const end = endTimeInput.value;
        
        if (start && end) {
            const hasOverlap = conflictingEvents.some(e => {
                return (start < e.endTime && end > e.startTime);
            });
            if (hasOverlap) {
                alert("선택하신 시간은 이미 예약되어 있습니다.\n아래 [예약 불가 시간]을 피해 다시 설정해 주세요.");
                startTimeInput.value = '';
                endTimeInput.value = '';
            }
        }
    }

    // Attach listeners for dynamic time availability
    dateInput.addEventListener('change', updateTimeAvailability);
    locationSelect.addEventListener('change', updateTimeAvailability);
    locationInput.addEventListener('input', updateTimeAvailability);
    vehicleSelect.addEventListener('change', updateTimeAvailability);
    startTimeInput.addEventListener('change', updateTimeAvailability);
    endTimeInput.addEventListener('change', updateTimeAvailability);
