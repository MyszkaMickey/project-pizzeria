import { select, settings, templates, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';


class Booking{
  constructor(element){
    const thisBooking = this;

    /* start render - that has reference to the container - element */
    thisBooking.render(element);

    thisBooking.initWidgets();

    thisBooking.getData();

    /* NEW - to keep info about selected table */
    thisBooking.tableSelected;
    console.log(thisBooking.selectedTable);
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
  
      ],
  
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
  
      ],
  
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
  
    };

    // console.log('getData params', params);

    const urls = {
    
      booking: settings.db.url + '/' + settings.db.bookings
          + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events
          + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.events
          + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
    
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);

        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(const item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(const item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(const item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    // console.log(thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] === 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);


    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof thisBooking.booked[date] [hourBlock] === 'undefined'){
        thisBooking.booked[date] [hourBlock] = [];
      }
      
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] === 'undefined' 
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] === 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element){
    const thisBooking = this;

    /* generate HTML based on template */
    const generatedHTML = templates.bookingWidget(element);

    /* create empty DOM element */
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    /* make reference to people and hours inputs + datepicker and hourpicker and tables*/
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

    /* NEW make reference to phone and address and starters and form*/
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelector(select.booking.starters);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.bookingSubmit);

    /* NEW make reference to container of tables */
    thisBooking.dom.tablesContainer = thisBooking.dom.wrapper.querySelector(select.booking.allTables);

  } 

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('click', function(){

    }),

    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('click', function(){

    });

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.dom.datePicker.addEventListener('click', function(){

    });

    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.hourPicker.addEventListener('click', function(){

    });

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      for (let table of thisBooking.dom.tables) {
        table.classList.remove(classNames.booking.tableSelected);
      }
      thisBooking.updateDOM();
    });
    /* NEW start initTables when there's a click on tablesContainer */
    thisBooking.dom.tablesContainer.addEventListener('click', function(event){
      thisBooking.initTables(event);
    });

    thisBooking.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  /* NEW make function initTables */
  initTables(event){
    const thisBooking = this;

    /* NEW find clicked element */
    const clickedElement = event.target;
    event.preventDefault();
    
    /* NEW find table id of clicked table */
    const tableId = clickedElement.getAttribute('data-table');
    // console.log('tableId', tableId);

    /* NEW if a table was clicked */
    if(tableId){

      /* if a table is already booked - show alert */
      if(clickedElement.classList.contains(classNames.booking.tableBooked)){
        alert('Ten stolik jest zajęty');

        /* if it's not booked */
      }else{

        /*for every table - if it contains class selected and it's not a clicked element - remove class selected */
        for(const table of thisBooking.dom.tables){
          if(table.classList.contains(classNames.booking.tableSelected) && table !== clickedElement){
            table.classList.remove(classNames.booking.tableSelected);
          }
        }
  
        /* other way - the table is selected - add class selected */
        thisBooking.tableSelected = tableId;
        clickedElement.classList.add(classNames.booking.tableSelected);
      }
    }
  }
 
  /* NEW make function sendOrder */
  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;

    const boookingSumUp = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: parseInt(thisBooking.selectedTable),
      duration: parseInt(thisBooking.hoursAmount.value),
      ppl: parseInt(thisBooking.peopleAmount.value),
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    thisBooking.dom.starters.addEventListener('click', function(event){

      const clickedElement = event.target;
      if(clickedElement.tagName === 'input' && clickedElement.type === 'checkbox' && clickedElement.name === 'starter'){
        if(clickedElement.checked === true){
          boookingSumUp.starters.push(clickedElement.value);
        } else if(clickedElement.checked === false){
          boookingSumUp.starters.splice(thisBooking.starters.indexOf(clickedElement.value), 1);
        }
      }
  
      console.log('starter', clickedElement);
    });
  

    console.log('boookingSumUp', boookingSumUp);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(boookingSumUp),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        thisBooking.makeBooked(boookingSumUp.date, boookingSumUp.hour, boookingSumUp.duration, boookingSumUp.table);
        console.log('parasedResponse', parsedResponse);
      });
  }
}
export default Booking;