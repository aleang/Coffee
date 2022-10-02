const moment = require('moment')

module.exports = {
    /**
     * Will convert a body of string into usable data for the next helper function
     * @param {string} content 
     * @returns {string} Schedule created from 'makeSchedule'
     */
    parseRequest: function(content) {
        if (!content) throw new Error('Booking request is empty')
        const lines = content.split(/\r?\n/)
        if (lines.length < 3) throw new Error('No individual booking request. Need 3 lines input minimum.')
        if (lines.length% 2 === 0) throw new Error('Booking request must have "2x+1" number of lines, eg odd numbers of lines only.')
    
        // assumes the remaining lines are in correct syntax
        const openAndClose = lines[0].split(/\s+/);
        const bookingRequest = {
            openingHour: +openAndClose[0], // number from 0 to 2359
            closingHour: +openAndClose[1],
            orders: []
        }
    
        for (let i = 1; i < lines.length; i+=2) {
            const line1 = lines[i].split(/\s+/)
            const line2 = lines[i+1].split(/\s+/)

            // 2022-03-17 10:17:06 001
            const requestTime = `${line1[0]}T${line1[1]}` // UTC format string

            // 2022-03-21 09:00 2
            const deliveryDate = line2[0] // date in string
            const deliveryStart = +(line2[1].replace(':', '')) // time in number (0-2359)
            const deliveryEnd = deliveryStart + (+line2[2] * 100) // time in number also
            
            const order = {
                requestTime,
                employeeId: line1[2],
                deliveryDate,
                deliveryStart,
                deliveryEnd
            }
            bookingRequest.orders.push(order)
        }
    
        return this.makeSchedule(bookingRequest)
    },

    /**
     * Accepts request and work out which orders are suitable for schedule
     * Create object with list of orders (string[]), keyed by the date (string)
     * Assumption: open hours not 24/7 so should not close midnight
     * @param {Object} request
     * @param {Object.openingHour} number opening hour
     * @param {Object.closingHour} number closing hour
     * @param {Object.orders} Array orders { request time, employee ID, delivery date, delivery start, delivery end }
     * @return {string} Schedule formatted by 'displaySchedule'
     */
    makeSchedule: function (request) {
        const { openingHour, closingHour, orders } = request
        
        // remove orders outside of coffee ordering hours
        const validOrders = orders.filter(({ deliveryStart, deliveryEnd }) => {
          if (deliveryStart > deliveryEnd) return false;
          return deliveryStart >= openingHour && deliveryEnd <= closingHour
        });
    
        // sort by time when order is placed
        validOrders.sort(( a, b ) => { return a.requestTime < b.requestTime ? -1 : 1 })
        
        // process coffee orders, remove any clashed orders
        const acceptedOrders = [validOrders[0]];
        for (let i = 1; i < validOrders.length; i++) {
          const currentOrder = validOrders[i]
    
          const clash = acceptedOrders.some((existingOrder) => {
            if (existingOrder.deliveryDate !== currentOrder.deliveryDate) return false;
    
            return existingOrder.deliveryStart < currentOrder.deliveryEnd &&
                existingOrder.deliveryEnd > currentOrder.deliveryStart
            });
          
            if (!clash) {
                acceptedOrders.push(currentOrder)
            }
        }

        // order accepted orders by date+time first
        acceptedOrders.sort((a, b) => {
            if (a.deliveryDate === b.deliveryDate) {
              return a.deliveryStart < b.deliveryStart ? -1 : 1  
            }
            return a.deliveryDate < b.deliveryDate ? -1 : 1
        });


        // group orders by delivery date
        // sourced from https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
        const groupBy = function(xs, key) {
            return xs.reduce(function(rv, x) {
              (rv[x[key]] = rv[x[key]] || []).push(x);
              return rv;
            }, {});
        };
        return this.displaySchedule(groupBy(acceptedOrders, 'deliveryDate'))
    },

    /**
     * Display the schedule in the format required
     * Assumption: format consists of a date, and list of orders
     * @param {Object} deliverySchedule object created from makeSchedule()
     * @returns {string} Multi-lined string of the order, formatted as specified in the document
     */
    displaySchedule: function (deliverySchedule) {
        // Convert number from 0-2400 into human readable time 'xx:yy'
        const timeInFormat = (time) => {
            const hour = Math.round(time / 100)
            const minute = time % 100
            return `${hour < 10 ? '0': ''}${hour}:${minute < 10 ? '0': ''}${minute}`
        }
        
        // Create output for each day's order
        let output = '';
        for (const [deliveryDate, orders] of Object.entries(deliverySchedule)) {
          output += `${deliveryDate}\n`
          
          orders.forEach(o => {
            output += `${timeInFormat(o.deliveryStart)} ${timeInFormat(o.deliveryEnd)} ${o.employeeId}\n`
          });
        }
        return(output);
    }
}
