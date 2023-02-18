const {ipcRenderer} = require('electron');
let entry_num_show = 0;
let entry_num_movie = 0;

function listingLoaded(image, num)
{
    $('.item').each(function() 
    {
        if($(this).children(0).attr('src') == `http://localhost:3000${image}`) 
        {
            setTimeout(() => {
                $(this).removeClass('before-loaded')
                $(this).addClass('after-loaded')
                console.log('added')
            }, (num * 500));     
        }
    });
}

function lazy_init_owl() {

    $('.owl-features').owlCarousel({
        items: 3,
        loop: true,
        dots: false,
        autoplay: true,
        lazyLoad: true,
        nav: true,
        margin: 30,
        responsive: { 0: { items: 3 }, 600: { items: 5 }, 1200: { items: 6 }, 1800: { items: 7 } }
    })

    $('.owl-collection').owlCarousel({
        items: 3,
        loop: true,
        dots: false,
        autoplay: true,
        lazyLoad: true,
        margin: 30,
        nav: true,
        responsive: { 0: { items: 1 }, 800: { items: 2 }, 1000: { items: 3 } }
    })

    $('.owl-banner').owlCarousel({
        items: 1,
        loop: true,
        dots: false,
        autoplay: true,
        lazyLoad: true,
        nav: true,
        margin: 30,
        responsive: { 0: { items: 1 }, 600: { items: 1 }, 1000: { items: 1 } }
    })

}

function check_response(data)
{
    if (data.code != 200)
    {
        if (!data.message)
            alert(data.message.code);
        else
            alert(data.message)
    }
}

function create_carousel(obj)
{
    const parent = document.querySelectorAll('.owl-carousel');

    const aDiv = document.createElement('a');
    aDiv.setAttribute('href', './view.html')

    const itemDiv = document.createElement('div');
    itemDiv.classList.add('item');

    const thumbDiv = document.createElement('div');
    thumbDiv.classList.add('thumb');
    itemDiv.appendChild(thumbDiv);

    const imageElement = document.createElement('img');
    imageElement.setAttribute('src', `http://localhost:3000${obj.Cover}`);
    
    thumbDiv.appendChild(imageElement);

    const hoverDiv = document.createElement('div');
    hoverDiv.classList.add('hover-effect');
    thumbDiv.appendChild(hoverDiv);
    const h6Element = document.createElement('h6');
    h6Element.textContent = obj.Title;
    hoverDiv.appendChild(h6Element);

    const h4Element = document.createElement('h4');
    //h4Element.innerHTML = `${obj.Title}<br><span>${obj.Date}</span>`;
    //itemDiv.appendChild(h4Element);
    aDiv.appendChild(itemDiv);
    parent[0].appendChild(aDiv);
}

async function getinfo(Key)
{ 
    const content = document.getElementsByClassName('contentarea')[0];
    content.innerHTML = await (await fetch('view.html')).text();
}

function create_listing(obj, num)
{
    const parent = document.getElementsByClassName('show-listings')[0];

    const container = document.createElement('div');
    container.classList.add('col-2'); 
    // if ($(window).width() > 1200) {
    //     container.classList.add('col-sm-2'); 
    // }
    // else { container.classList.add('col-sm-2'); }

    const item = document.createElement('div');
    item.classList.add('item', 'before-loaded');

    const binding = document.createElement('a');
    binding.setAttribute('onclick', `getinfo('${obj.Key}')`);

    const img = document.createElement('img');
    img.setAttribute('src', `http://localhost:3000${obj.Cover}`);
    img.setAttribute('onload', `listingLoaded('${obj.Cover}', '${num++}')`)
    img.classList.add('image-lazy-load')

    const heading = document.createElement('h4');
    heading.style = 
    `text-overflow: ellipsis; 
    white-space: nowrap; 
    overflow: hidden; 
    width: 100px;`
    heading.textContent = obj.Title;

    const span = document.createElement('span');
    span.textContent = obj.Date;

    heading.appendChild(span);
    item.appendChild(img);
    item.appendChild(heading);
    binding.appendChild(item);
    container.appendChild(binding);
    parent.appendChild(container);
}

async function getListing()
{
    const json = await ipcRenderer.sendSync('popular');
    console.log(json);

    // const Store = require('electron-store');

    // const store = new Store();

    // if (store.get('listings-time') == null)
    // {
    //     console.log(`localStorage.getItem('listings-time') == null`)
    //     store.set('listings-time', Math.floor(Date.now() / 1000));
    //     const respond = await getJSON('http://localhost:3000/popular', requestOptions)
    //     store.set('listings-cache', respond);
    //     json = respond;
    // }
    // else
    // {
    //     console.log(`else`)
    //     if (store.get('listings-cache') != null)
    //     {
    //         console.log(`if (localStorage.getItem('listings-cache') != null)`)
    //         if (Math.floor(Date.now() / 1000) - store.get('listings-time') < 1800)
    //         {
    //             console.log(`if (Math.floor(Date.now() / 1000) - localStorage.getItem('listings-time') < 1800)`)
    //             console.log(`cached from ${(Math.floor(Date.now() / 1000) - store.get('listings-time')) / 60} mins ago`)
    //             json = store.get('listings-cache')
    //         }
    //         else
    //         {
    //             console.log(`else`)
    //             const response = await getJSON('http://localhost:3000/popular', requestOptions)
    //             store.set('listings-cache', response)
    //             json = response
    //         }
    //     }
    //     else
    //     {
    //         console.log(`else`)
    //         const response = await getJSON('http://localhost:3000/popular', requestOptions)
    //         window.localStorage.setItem('listings-cache', response)
    //         window.localStorage.setItem('listings-time', Math.floor(Date.now() / 1000));
    //     }
    // }

    check_response(json)

    for (let i = 0; i < json.results.shows.length; i++) 
    {
        const obj = json.results.shows[i]
        create_listing(obj, entry_num_show)
    }
    entry_num_show = 0;

    const parent = document.querySelectorAll('.show-listings');

    const container = document.createElement('div');
    container.classList.add('col-lg-12');

    const button = document.createElement('div');
    button.classList.add('main-button');

    const link = document.createElement('a');
    link.setAttribute('href', 'browse.html');
    link.textContent = 'Discover Popular';

    button.appendChild(link);

    container.appendChild(button);
    parent[0].appendChild(container);

    for (let i = 0; i < json.results.movies.length; i++) 
    {
        const obj = json.results.movies[i];
        create_carousel(obj);
    }

    lazy_init_owl();
}

async function search(keyword)
{
    console.log(`sending data -> keyword=${keyword}`)

    const data = await ipcRenderer.sendSync('search', `keyword=${keyword}`);
    console.log(data);

    check_response(data)

    const parent = document.querySelectorAll('.show-listings');

    const div = document.createElement("div");
    div.classList.add("container", "result-type");

    const h6 = document.createElement("h6");
    h6.textContent = `TV Series (${data.results.shows.length + 1} results)`;

    div.appendChild(h6);

    parent[0].appendChild(div)

    for (let i = 0; i < data.results.shows.length; i++) 
    {
        const obj = data.results.shows[i];
        create_listing(obj, entry_num_show)
    }
    entry_num_show = 0;

    const div1 = document.createElement("div");
    div1.classList.add("container", "result-type");

    const h61 = document.createElement("h6");
    h61.textContent = `Movies (${data.results.movies.length + 1} results)`;
    div1.appendChild(h61);

    parent[0].appendChild(div1)

    for (let i = 0; i < data.results.movies.length; i++) 
    {
        const obj = data.results.movies[i];
        create_listing(obj, entry_num_movie)
    }
    entry_num_movie = 0;
}