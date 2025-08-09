import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import koLocale from '@fullcalendar/core/locales/ko';
import { supabase } from './supabaseClient';
import './FullCalendar.css';

const CalendarFreeVersion = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });
  const [newEvent, setNewEvent] = useState({ id: null, title: '', team: '', label_id: '', start: '', end: '', completed: false });
  const [isEditing, setIsEditing] = useState(false);
  // 상태 초기값을 localStorage에서 불러오기
  const [showFullTitles, setShowFullTitles] = useState(() => {
    const saved = localStorage.getItem('showFullTitles');
    return saved === 'true'; // 저장된 값이 'true'면 true, 아니면 false
  });

  // 구글 공휴일 API 
  const GOOGLE_API_KEY = 'AIzaSyCMgtiK1vFehQQo1ptqq0VaPIn7wzjchRI';
  const KOREA_HOLIDAY_CAL_ID = 'ko.south_korea%23holiday%40group.v.calendar.google.com';
  const [holidayEvents, setHolidayEvents] = useState([]);

  // 라벨
  const [labels, setLabels] = useState([]);
  const [labelManageOpen, setLabelManageOpen] = useState(false);
  const [labelEditOpen, setLabelEditOpen] = useState(false);
  const [newLabel, setNewLabel] = useState({ id: null, label: '', color: '#f4f4f4' });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 🔄 라벨 및 일정 로드
  useEffect(() => {
    fetchLabels();
  }, []);
  useEffect(() => {
    if (labels.length > 0) fetchEvents();
  }, [labels]);

  // 제목 체크값이 변경될 때 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('showFullTitles', showFullTitles);
  }, [showFullTitles]);

  // 라벨 fetchLabels 
  const fetchLabels = async () => {
    const { data, error } = await supabase.from('labels').select('*').order('created_at', { ascending: true });
    if (error) console.error('❌ fetchLabels error:', error);
    else setLabels(data);
  };

  // 전체 fetchLabels 
  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*');

    if (error) {
      console.error('🚨 events fetch error:', error);
      return;
    }

    setEvents(data.map(e => {
      const label = labels.find(l => l.id === e.label_id);
      
      // 디버깅: 라벨과 색상 정보 출력
      // console.log(`Event: ${e.title}, Label: ${e.label}, Color: ${labelColor}`);
      
      // 시작일과 종료일이 동일한 경우 FullCalendar가 인식할 수 있도록 종료일을 하루 뒤로 조정
      let endTime = e.end_time;
      if (e.start_time.slice(0, 10) === e.end_time.slice(0, 10)) {
        const endDate = new Date(e.end_time);
        endDate.setDate(endDate.getDate() + 1);
        endTime = endDate.toISOString();
      }
      
      return {
        id: e.id,
        title: e.title,
        start: e.start_time,
        end: endTime,
        backgroundColor: label?.color || '#eee',
        allDay: true, // 하루 이벤트의 배경색이 제대로 표시되도록 allDay 속성 추가
        classNames: e.completed ? ['completed-event'] : [],
        extendedProps: {
          team: e.team,
          completed: e.completed,
          label_id: e.label_id,
          labelName: label?.label || '', 
          color: label?.color || '#f4f4f4',
        }
      };
    }));
  };

  // 일정선택
  const handleDateSelect = (info) => {
    const dateStr = info.startStr.slice(0, 10);
    setNewEvent({ id: null, title: '', team: '', label_id: null, start: dateStr, end: dateStr, completed: false });
    setIsEditing(false);
    setModalOpen(true);
  };

  // 일정 추가, 수정
  const handleEventClick = (info) => {
    if (info.event.extendedProps?.isHoliday) return; // 공휴일: 무시

    const { id, title, start, end, extendedProps } = info.event;
    
    // 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // 종료일을 하루 뒤로 조정 (FullCalendar는 종료일을 포함하지 않음)
    const formatEndDate = (date) => {
      const adjustedDate = new Date(date);
      adjustedDate.setDate(adjustedDate.getDate() - 1);
      const year = adjustedDate.getFullYear();
      const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
      const day = String(adjustedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setNewEvent({
      id,
      title,
      team: extendedProps.team || '',
      label_id: extendedProps.label_id || '',
      start: formatDate(start),
      end: formatEndDate(end),
      completed: extendedProps.completed || false
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  // 일정 저장
  const saveEvent = async () => {
    const { id, title, team, label_id, start, end, completed } = newEvent;
    if (!title?.trim()) return alert('제목 입력 필수');
    const normalizeLabelId = (v) => (v === '' || v === undefined ? null : v);

    // 날짜를 ISO 형식으로 변환 (로컬 시간 기준)
    const formatDateTime = (dateStr) => {
      const date = new Date(dateStr + 'T00:00:00');
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    };

    // 종료일을 하루 뒤로 조정 (FullCalendar는 종료일을 포함하지 않음)
    const formatEndDateTime = (dateStr) => {
      const date = new Date(dateStr + 'T00:00:00');
      // 시작일과 종료일이 동일한 경우에도 하루 뒤로 설정하여 FullCalendar가 인식하도록 함
      date.setDate(date.getDate() + 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    };

    const dataToSave = {
      title,
      team,
      label_id: normalizeLabelId(label_id),
      start_time: formatDateTime(start),
      end_time: formatEndDateTime(end),
      completed
    };

    const result = isEditing
      ? await supabase.from('events').update(dataToSave).eq('id', id)
      : await supabase.from('events').insert(dataToSave);

    if (result.error) console.error('❌ event save error:', result.error.message);
    else {
      fetchEvents();
      setModalOpen(false);
    }
  };

  // 일정 삭제
  const deleteEvent = async () => {
    const { id } = newEvent;
    if (!id || !window.confirm('정말 삭제할까요?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
      fetchEvents();
      setModalOpen(false);
    }
  };

  // 일정 완료 처리
  const completEvent = async () => {
    const { id } = newEvent;
    const { error } = await supabase.from('events').update({ completed: true }).eq('id', id);
    if (!error) {
      fetchEvents();
      setModalOpen(false);
    }
  };
  
  // 일정 완료 취소 처리
  const restoreEvent = async () => {
    const { id } = newEvent;
    const { error } = await supabase.from('events').update({ completed: false }).eq('id', id);
    if (!error) {
      fetchEvents();
      setModalOpen(false);
    }
  };  

  // 일정막대바 드래그
  const handleEventDrop = async (info) => {
    if (info.event.extendedProps?.isHoliday) { info.revert(); return; } //공휴일 무시

    const { event } = info;
    
    // 드래그된 이벤트의 날짜를 ISO 형식으로 변환 (로컬 시간 기준)
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    };
    
    const { error } = await supabase.from('events').update({
      start_time: formatDateTime(event.start),
      end_time: formatDateTime(event.end)
    }).eq('id', event.id);

    if (error) console.error('🚨 event update error:', error);
    else fetchEvents();
  };

  // 일정막대바 사이즈 조정
  const handleEventResize = async (info) => {
    if (info.event.extendedProps?.isHoliday) { info.revert(); return; } //공휴일 무시

    const { event } = info;
    
    // 리사이즈된 이벤트의 날짜를 ISO 형식으로 변환 (로컬 시간 기준)
    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    };
    
    const { error } = await supabase.from('events').update({
      start_time: formatDateTime(event.start),
      end_time: formatDateTime(event.end)
    }).eq('id', event.id);

    if (error) console.error('🚨 event resize error:', error);
    else fetchEvents();
  };

  // 툴팁 사용
  const handleEventMouseEnter = (info) => {
    if (info.event.extendedProps?.isHoliday) return; // 공휴일: 무시

    const { clientX, clientY } = info.jsEvent;
    const { title, start, end, extendedProps } = info.event;

    const labelColor = extendedProps.color || '#fff';
    const labelName = extendedProps.labelName || '없음';    

    // 날짜 포맷
    const formatDate = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const startStr = start ? formatDate(start) : '';
    // FullCalendar는 end 날짜를 "다음날 00:00"으로 주는 경우가 있음
    const adjustedEnd = new Date(end);
    if (adjustedEnd) adjustedEnd.setDate(adjustedEnd.getDate() - 1);
    const endStr = end ? formatDate(adjustedEnd) : '';

    setTooltip({
      visible: true,
      x: clientX,
      y: clientY,
      content: (
        <div className="tooltip-content">
          <h3 className={`title ${extendedProps.completed ? 'completed' : ''}`}>{extendedProps.completed ? '✔️' : ''} {title}</h3>
          <p className='desc'>{extendedProps.team}</p>
          <p className='date'>{startStr} ~ {endStr}</p>
          {labelName && (
            <p className='label'>
              <span style={{ backgroundColor: labelColor, padding: '0.2rem 0.6rem', borderRadius: '0.3rem' }}>
                {labelName}
              </span>
            </p>
          )}
        </div>
      )
    });
  };
  
  // 툴팁 미사용
  const handleEventMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, content: null });
  };

  // 라벨 추가
  const saveLabel = async () => {
    const { id, label, color } = newLabel;
    if (!label) return alert('라벨명을 입력하세요');
    const result = id
      ? await supabase.from('labels').update({ label, color }).eq('id', id)
      : await supabase.from('labels').insert({ label, color });

    if (result.error) console.error('❌ saveLabel error:', result.error.message);
    else {
      fetchLabels();
      setNewLabel({ id: null, label: '', color: '#f4f4f4' });
      setLabelEditOpen(false);
    }
  }; 

  // 라벨 수정
  const editLabel = (l) => {
    setNewLabel({ id: l.id, label: l.label, color: l.color });
    setLabelEditOpen(true);
  };

  // 라벨 삭제
  const deleteLabel = async (id) => {
    if (!window.confirm('라벨을 삭제하면 연결된 일정에 표시되지 않을 수 있습니다. 삭제할까요?')) return;
    const { error } = await supabase.from('labels').delete().eq('id', id);
    if (!error) fetchLabels();
  }; 

  // ✅ 날짜 범위에 맞춰 공휴일 가져오기
  const fetchHolidays = async (start, end) => {
    try {
      const timeMin = new Date(start).toISOString();
      const timeMax = new Date(end).toISOString();

      const url =
        `https://www.googleapis.com/calendar/v3/calendars/${KOREA_HOLIDAY_CAL_ID}/events` +
        `?key=${GOOGLE_API_KEY}&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}` +
        `&maxResults=2500&singleEvents=true&orderBy=startTime`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.error) {
        console.error('Google API error:', json.error);
        return;
      }

      const mapped = (json.items || []).map((ev) => {
        const startStr = ev.start?.date || ev.start?.dateTime;
        // 구글 공휴일은 보통 date(종일)이 들어옵니다.
        // FullCalendar는 end를 "다음날 00:00"로 취급하므로 종료일 보정은 따로 안 해도 OK
        return {
          id: `holiday-${ev.id}`,
          title: ev.summary || '공휴일',
          start: startStr,
          end: ev.end?.date || ev.end?.dateTime,
          allDay: true,

          // 공휴일 보기 전용 잠금
          editable: false,
          startEditable: false,
          durationEditable: false,

          backgroundColor: '#ffe8e8',
          textColor: '#b10000',
          extendedProps: { 
            isHoliday: true, 
            source: 'google-holiday' 
          }
        };
      });

      setHolidayEvents(mapped);
    } catch (e) {
      console.error('fetchHolidays error:', e);
    }
  };

  // ✅ FullCalendar가 보여주는 날짜 범위가 바뀔 때마다 공휴일 갱신
  const handleDatesSet = (arg) => {
    // arg.start / arg.end 는 Date 객체
    fetchHolidays(arg.start, arg.end);
  };

  // 일정목록만 사용
  const viewTypeSet = (arg) => {
    setViewType(arg.view.type)
  };

  // ---------- list view에 라벨 추가 ----------
  const [viewType, setViewType] = useState('dayGridMonth');

  const renderListEventContent = (arg) => {
    const { color, labelName } = arg.event.extendedProps || {};
    return {
      html: `
        <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          ${
            color
              ? `<span style="display:inline-block; border-radius:5rem; padding:0 0.5rem; background:${color};">${labelName}</span>`
              : ''
          }
          <span>${arg.event.title}</span>
        </div>
      `
    };
  };

  return (
    <div className={`fc-title-mode ${showFullTitles ? 'wrap' : 'ellipsis'}`}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        eventResizableFromStart={true}
        events={[...events, ...holidayEvents]} // 일정 + 공휴일을 함께 렌더링
        datesSet={[handleDatesSet, viewTypeSet]} // 뷰가 바뀔 때마다(월 이동, 주간 전환 등) 공휴일 새로 로드 + 일정목록만 사용
        eventContent={viewType.startsWith('list') ? renderListEventContent : undefined} // 리스트 뷰일 때만 eventContent 지정
        eventClassNames={(arg) => { // 제목 체크박스 적용
          return showFullTitles ? ['full-title'] : ['short-title'];
        }}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={handleEventMouseLeave}
        height="100vh"
        weekends={true}
        headerToolbar={{
          left: `prevYear,prev,today,next,nextYear`,
          center: 'title',
          right: "dayGridMonth,dayGridWeek,listWeek"
        }}
        views={{
          dayGridMonth: { 
            dayMaxEventRows: 30, 
            buttonText: '월간' 
          },
          dayGridWeek: { buttonText: '주간' },
          timeGridWeek: { buttonText: '주간 시간' }
        }}
        buttonText={{
          today: "오늘",
        }}
        dayHeaderFormat={{ weekday: 'short' }}
        titleFormat={{ year: 'numeric', month: 'long' }}
        dayCellContent={(arg) => arg.dayNumberText.replace('일', '')}
        locale={koLocale}
        eventColor="rgba(0, 0, 0, 0.8)" // 이벤트 기본 색상 설정
        eventTextColor="rgba(0, 0, 0, 0.7)" // 이벤트 텍스트 색상 설정
        eventBackgroundColor="#e6f6e3" // 이벤트 배경 색상 설정
      />

      {/* 📅 일정 등록/수정 모달 */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <header>
              <div>
                <h3>
                🐋 {isEditing ? '일정 수정' : '일정 추가'}
                </h3>
                <div className='completed'>
                  {!newEvent.completed ? (
                    <div onClick={completEvent}>✔️ 완료</div>
                  ) : (
                    <div onClick={restoreEvent}>✖️ 취소</div>
                  )}
                </div>
              </div>
              <div className='label-box'>
                <button onClick={() => setLabelManageOpen(true)} className='btn btn-round'>🏷️ 라벨관리</button>
                <button onClick={() => setModalOpen(false)} className='btn btn-roundline'>닫기</button>
              </div>
            </header>

            <label className='title-label'>
              <textarea type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder='제목 입력' />
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
              <input type="checkbox" checked= { showFullTitles} onChange= { (e) => setShowFullTitles(e.target.checked)} />
              일정바 제목 전체보기
            </label>

            <label className='desc-label'>
              <textarea type="text" value={newEvent.team} onChange={(e) => setNewEvent({ ...newEvent, team: e.target.value })} placeholder='내용 입력' />
            </label>

            {/* 라벨 선택 */}
            <label className="label-label">
              <div className="dropdown-wrapper" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <div className="dropdown-selected" style={{ backgroundColor: labels.find(l => l.id === newEvent.label_id)?.color || '#f4f4f4' }}>
                  {labels.find(l => l.id === newEvent.label_id)?.label || '라벨 선택'}
                </div>

                {dropdownOpen && (
                  <ul className="dropdown-options">
                    <li onClick={() => { setNewEvent(prev => ({ ...prev, label_id: null })); setDropdownOpen(false); }} className="dropdown-option" >
                      + 선택없음 +
                    </li>
                    {labels.map(l => (
                      <li key={l.id} style={{ backgroundColor: l.color }} onClick={() => { setNewEvent({ ...newEvent, label_id: l.id }); setDropdownOpen(false); }} className="dropdown-option">
                        {l.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </label>

            <label>
              <input type="date" value={newEvent.start} onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })} /> ~
              <input type="date" value={newEvent.end} onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })} />
            </label>

            <div className="btn-wrap">
              <div>
                {isEditing && <button onClick={deleteEvent} className='btn btn-point'>삭제</button>}
              </div>
              <div>
                <button onClick={saveEvent} className='btn btn-gray'>{isEditing ? '수정' : '저장'}</button>
                <button onClick={() => setModalOpen(false)} className='btn btn-grayline'>취소</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 일정 툴팁 */}
      {tooltip.visible && (
        <div 
          className="tooltip"
          style={{
            top: `${tooltip.y + 10}px`,
            left: `${tooltip.x + 10}px`,
          }}
        >
          {tooltip.content}
        </div>
      )}

      {/* 🎨 라벨 관리 패널 */}
      {labelManageOpen && (
        <div className="modal-overlay ">
          <div className="label-panel">
            <div className='btn-wrap'>
              <button onClick={() => setLabelEditOpen(true)} className='btn btn-gray'>➕ 라벨 추가</button>
              <button onClick={() => setLabelManageOpen(false)} className='btn btn-grayline'>닫기</button>
            </div>
            <ul>
              {labels.map(l => (
                <li key={l.id}>
                  <p style={{ backgroundColor: l.color }}>{l.label}</p>
                  <button onClick={() => editLabel(l)}>✏️</button>
                  <button onClick={() => deleteLabel(l.id)}>❌</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 📝 라벨 추가/수정 모달 */}
      {labelEditOpen && (
        <div className="modal-overlay ">
          <div className="modal-labels">
            <h3>라벨 {newLabel.id ? '수정' : '추가'}</h3>
            <input value={newLabel.label} onChange={(e) => setNewLabel({ ...newLabel, label: e.target.value })} placeholder="라벨명" />
            <input type="text" value={newLabel.color} onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value })} placeholder="#HEX색상" maxLength={7}/>
            <div className="btn-wrap">
              <button onClick={saveLabel} className='btn btn-primary'>저장</button>
              <button onClick={() => setLabelEditOpen(false)} className='btn btn-grayline'>닫기</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default CalendarFreeVersion;