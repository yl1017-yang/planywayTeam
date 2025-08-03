// 설치 필요 패키지:
// npm install @fullcalendar/react @fullcalendar/resource-timeline @fullcalendar/interaction @fullcalendar/core

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import "./FullCalendar.css";
import { supabase } from './supabaseClient';

const CalendarFreeVersion = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*');
    if (error) console.error('🚨 events fetch error:', error);
    else setEvents(data.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start_time,
      end: e.end_time,
      className: e.team === 'alice' ? 'alice-event' : 'bob-event'
    })));
  };

  const handleDateSelect = async (selectInfo) => {
    const title = prompt('일정 제목을 입력하세요') || 'New Event';
    const team = prompt('팀원 이름을 입력하세요 (예: alice, bob)') || 'alice';

    const { data, error } = await supabase.from('events').insert([{
      title,
      start_time: selectInfo.startStr,
      end_time: selectInfo.endStr,
      team,
    }]);

    if (!error) fetchEvents();
  };

  const handleEventDrop = async (info) => {
    const { event } = info;
    const { error } = await supabase.from('events').update({
      start_time: event.start,
      end_time: event.end
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
        eventDrop={handleEventDrop}
        height="100vh"
        weekends={true}
        headerToolbar={{
          left: `prevYear,prev,next,nextYear today, `,
          center: 'title',
          right: "dayGridMonth,dayGridWeek,dayGridDay, timeGridWeek,timeGridDay"
        }}
        views={{
          dayGridMonth: { 
            dayMaxEventRows: 16,
            buttonText: '월간'
          },
          dayGridWeek: { 
            buttonText: '주간'
          },
          dayGridDay: { 
            buttonText: '일간'
          },
        }}
        buttonText={{
          // prev: "이전",
          // next: "다음",
          // prevYear: "이전 년도",
          // nextYear: "다음 년도",
          today: "오늘",
          timeGridWeek: "주별시간",
          timeGridDay: "일별시간",
          list: "리스트"
        }}
        eventColor="rgba(0, 0, 0, 0.8)"
        eventTextColor="rgba(0, 0, 0, 0.8)"
        eventBackgroundColor="#e6f6e3"
      />
    </div>
  );
};

export default CalendarFreeVersion;