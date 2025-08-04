import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './FullCalendar.css';
import { supabase } from './supabaseClient';

const LABELS = [
  { label: '풀샵/임직원', color: '#d6f5d6' },
  { label: '상세페이지', color: '#d6f5d6' },
  { label: '촬영', color: '#fdf3bf' },
  { label: '올가', color: '#f9e79f' },
  { label: 'UIUX 및 개선', color: '#f8d7da' },
  { label: '휴가/교육', color: '#e2a7a7' },
  { label: '퍼블', color: '#e5ccff' },
  { label: '외부몰 썸네일 및 상품등록', color: '#b3d1ff' },
  { label: '외부몰 기획전 및 배너', color: '#c1e7f2' },
  { label: '제휴', color: '#fcd6ea' },
  { label: 'CFS', color: '#f2c2f0' },
  { label: '회의/기타', color: '#d3d3d3' }
];

const CalendarFreeVersion = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ id: null, title: '', team: '', label: '', start: '', end: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*');
    if (error) console.error('🚨 events fetch error:', error);
    else setEvents(data.map(e => {
      const labelColor = LABELS.find(l => l.label === e.label)?.color || '';
      return {
        id: e.id,
        title: e.title,
        start: e.start_time,
        end: e.end_time,
        backgroundColor: labelColor,
        extendedProps: { team: e.team, label: e.label }
      };
    }));
  };

  const handleDateSelect = (selectInfo) => {
    setNewEvent({
      id: null,
      title: '',
      team: '',
      label: '',
      start: selectInfo.startStr.slice(0, 10),
      end: selectInfo.endStr.slice(0, 10)
    });
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const { id, title, start, end, extendedProps } = clickInfo.event;
    
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
      label: extendedProps.label || '',
      start: formatDate(start),
      end: formatEndDate(end)
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  const saveEvent = async () => {
    const { id, title, team, label, start, end } = newEvent;
    if (!title) return alert('제목을 입력하세요');

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
      date.setDate(date.getDate() + 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    };

    const dataToSave = {
      title,
      team,
      label,
      start_time: formatDateTime(start),
      end_time: formatEndDateTime(end)
    };

    if (isEditing) {
      const { error } = await supabase.from('events').update(dataToSave).eq('id', id);
      if (!error) {
        fetchEvents();
        setModalOpen(false);
      } else {
        console.error('🚨 update error:', error);
      }
    } else {
      const { error } = await supabase.from('events').insert([dataToSave]);
      if (!error) {
        fetchEvents();
        setModalOpen(false);
      } else {
        console.error('🚨 insert error:', error);
      }
    }
  };

  const deleteEvent = async () => {
    const { id } = newEvent;
    if (!id) return;
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
      fetchEvents();
      setModalOpen(false);
    } else {
      console.error('🚨 delete error:', error);
    }
  };

  const handleEventDrop = async (info) => {
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

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        height="100vh"
        weekends={true}
        headerToolbar={{
          left: `prevYear,prev,next,nextYear today`,
          center: 'title',
          right: "dayGridMonth,dayGridWeek,timeGridWeek"
        }}
        views={{
          dayGridMonth: { dayMaxEventRows: 16, buttonText: '월간' },
          dayGridWeek: { buttonText: '주간' },
          timeGridWeek: { buttonText: '주간 시간' }
        }}
        buttonText={{
          today: "오늘",
          timeGridWeek: "주별시간"
        }}
        eventColor="rgba(0, 0, 0, 0.8)"
        eventTextColor="rgba(0, 0, 0, 0.8)"
        eventBackgroundColor="#e6f6e3"
      />

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{isEditing ? '일정 수정' : '일정 추가'}</h3>

            <label>
              <span>제목</span>
              <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
            </label>

            <label>
              <span>팀원</span>
              <input type="text" value={newEvent.team} onChange={(e) => setNewEvent({ ...newEvent, team: e.target.value })} />
            </label>

            <label>
              <span>라벨</span>
              <select value={newEvent.label} onChange={(e) => setNewEvent({ ...newEvent, label: e.target.value })} style={{ backgroundColor: LABELS.find(l => l.label === newEvent.label)?.color || 'white' }}>
                <option value="">선택 없음</option>
                {LABELS.map(({ label, color }) => (
                  <option key={label} value={label} style={{ backgroundColor: color }}>{label}</option>
                ))}
              </select>
            </label>

            <label>
              <span>시작일</span>
              <input type="date" value={newEvent.start} onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })} />
            </label>

            <label>
              <span>종료일</span>
              <input type="date" value={newEvent.end} onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })} />
            </label>

            <div className="modal-buttons">
              <button onClick={saveEvent}>{isEditing ? '수정' : '저장'}</button>
              {isEditing && <button onClick={deleteEvent}>삭제</button>}
              <button onClick={() => setModalOpen(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarFreeVersion;