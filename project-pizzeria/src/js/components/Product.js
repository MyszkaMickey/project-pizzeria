import { select, classNames, templates } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from '../components/AmountWidget.js';



class Product{
  constructor(id, data){
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();


    // console.log('new Product:', thisProduct);
  }

  renderInMenu(){
    const thisProduct = this;

    /* DONE generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /* DONE create element using utils.createElementFromHTML */

    thisProduct.element = utils.createDOMFromHTML(generatedHTML);


    /* DONE find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* DONE add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;
      
    thisProduct.dom = {};
    thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
    thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
    // console.log(thisProduct.amountWidget);

    thisProduct.dom.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }

  initAccordion(){
    const thisProduct = this;

    /* DONE find the clickable trigger (the element that should react to clicking) */
    // const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable); zmiana na thisProduct.accordionTrigger

    /* DONE START: add eventListener to clickable trigger on event click */
    thisProduct.dom.accordionTrigger.addEventListener('click', function(event){

      /* DONE prevent default action for event */
      event.preventDefault();

      /* DONE find active product (product that has active class) */
      const activeProducts = document.querySelectorAll(select.all.menuProductsActive);
         

      /* DONE START a loop for every active product */
      for(let activeProduct of activeProducts){

        /* DONE if there is active product and it's not thisProduct.element, remove class active from it */
        if(activeProduct !== thisProduct.element){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        /* DONE END a loop for every active product */
      }

      /* DONE toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }

  initOrderForm(){
    const thisProduct = this;
      
    thisProduct.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
      
    for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
      
    thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder() {
    const thisProduct = this;
    
    /* convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']} */
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    // console.log('formData', formData);
    
    /* set price to default price */
    let price = thisProduct.data.price;
    
    /* for every category (param)... */
    for(let paramId in thisProduct.data.params) {

      /* determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... } */
      const param = thisProduct.data.params[paramId];
      // console.log(paramId, param);
    
      /* for every option in this category */
      for(let optionId in param.options) {

        /* determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true } */
        const option = param.options[optionId];
        // console.log(optionId, option);

        /* check if there is param with the name of paramId in formData and if it includes optionId */

        const optionSelected = (formData[paramId] && formData[paramId].includes(optionId));
        if(optionSelected){

          /* check if this option is not default*/
          if(option.default !== true){

            /* add option price to price variable */
            price = price + option.price;
          }
        } else {

          /* check if the option is default */
          if(option.default == true){

            /* reduce price variable */
            price = price - option.price;
          }
        }
        /* find image with class paramId-optionId */
        const optionImage = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);

        /* check if it's there because not every product has an image */
        if(optionImage){
          
          /* if it's there, check if the option is selected */
          if(optionSelected){

            /* if the option is selected add class active */
            optionImage.classList.add(classNames.menuProduct.imageVisible);
              
          } else{

            /* if it's not selected, remove class active */
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }

      }
    }
    /* multiply price by amount */
    price *= thisProduct.amountWidget.value;

    /* add new property "priceSingle" to thisProduct */
    thisProduct.priceSingle = price;
    thisProduct.price = price;

    /* update calculated price in the HTML */
    thisProduct.dom.priceElem.innerHTML = price;
  }

  addToCart(){
    const thisProduct = this;

    // app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct(){
    const thisProduct = this;
      
    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.price,
      params: thisProduct.prepareCartProductParams(),
    };

    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;
      
    /* convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']} */
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    // console.log('formData', formData);
      
    /* add an empty object params */

    const params = {};

    /* for every category (param)... */
    for(let paramId in thisProduct.data.params) {
  
      /* determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... } */
      const param = thisProduct.data.params[paramId];
      // console.log(paramId, param);

      /* create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}} */
      params[paramId] = {
        label: param.label,
        options: {},
      };
      
      /* for every option in this category */
      for(let optionId in param.options) {
  
        /* determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true } */
        const option = param.options[optionId];
        // console.log(optionId, option);
  
        /* check if there is param with the name of paramId in formData and if it includes optionId */
  
        const optionSelected = (formData[paramId] && formData[paramId].includes(optionId));
        if(optionSelected){
          params[paramId].options[optionId] = option.label;
        }
      }
    }
    return params;
  }
}

export default Product;