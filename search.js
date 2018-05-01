const applicationID = '0SQJCGW54X';
const apiKey = '27e4a1695307e93e63743e67aeda4b29';
const indexName = 'restaurants';
const client = algoliasearch(applicationID, apiKey);

let helper = algoliasearchHelper(client, indexName, {
  facets: ['stars_count'],
  disjunctiveFacets: ['food_type', 'payment_options']
});

// Admittedly a tad hacky - used to handle pagination smoothly
var appendResults = false;

$('#restaurant-search').on('keyup', e => {
  appendResults = false;
  helper.setQuery(e.currentTarget.value).search();
});

$('#food-types').on('click', 'li[id^="ft-"]', e => {
  appendResults = false;
  let facetValue = e.currentTarget.children[0].children[0].innerText;
  helper.toggleFacetRefinement('food_type', facetValue).search();
});

$('#payment-types').on('click', 'li[id^="pt-"]', e => {
  appendResults = false;
  let facetValue = e.currentTarget.children[0].children[0].innerText;
  // Lump Carte Blanche and Diners Club in with Discover
  if (facetValue === 'Discover') {
    helper.toggleFacetRefinement('payment_options', 'Carte Blanche')
    helper.toggleFacetRefinement('payment_options', 'Diners Club')
  }
  helper.toggleFacetRefinement('payment_options', facetValue).search();
});

function starsRefinementExists(helper) {
  return helper.state.numericRefinements.stars_count &&
         helper.state.numericRefinements.stars_count['>'] &&
         helper.state.numericRefinements.stars_count['>'][0];
}

// Assumes starsRefinementExists(helper) check has already been performed
function getStarsRefinement(helper) {
  return helper.state.numericRefinements.stars_count['>'][0];
}

$('#stars-count').on('click', 'li', e => {
  if (starsRefinementExists(helper)) {
    // Pull the number of stars by which we're about to refine from the <li>'s ID (set statically in index.HTML)
    let clickedStarCount = parseInt(e.currentTarget.id.match(/\d/)[0]);
    let refinedStarCount = getStarsRefinement(helper);
    // Undo existing refinement/styling - and stop there - if user is clicking on it again, since they set it
    if (clickedStarCount === refinedStarCount) {
      helper.removeNumericRefinement('stars_count').search();
      $('li.stars').removeClass('not-selected-stars');
      return;
    }
  }

  [].slice.call($(e.currentTarget).siblings()).forEach(el => { el.classList.add('not-selected-stars') });
  $(e.currentTarget).removeClass('not-selected-stars');
  let facetValue = e.currentTarget.id.match(/\d/)[0];
  // Clear potential existing filter and apply new one
  helper.removeNumericRefinement('stars_count').search();
  helper.addNumericRefinement('stars_count', '>', facetValue).search();
});

function renderFoodTypeList(content) {
  $('#food-types').html(() => {
    return $.map(content.getFacetValues('food_type'), foodType => {
      let li = $(`<li id=ft-${foodType.name} class="facet-item"></li>`);
      li.html(`<p class="facet-wrapper"><span class="facet-option">${foodType.name}</span><span class="results-for-type">${foodType.count}</span></p>`);
      if(foodType.isRefined) li.addClass('selected-facet');
      return li;
    });
  });
}

function renderPaymentFacetList(content) {
  let permittedPaymentTypes = ['MasterCard', 'Visa', 'AMEX', 'Discover'];
  let paymentTypes = content.getFacetValues('payment_options');
  $('#payment-types').html(() => {
    return $.map(paymentTypes, paymentType => {
      var li;
      // Skip unnecessary payment options
      if (!(permittedPaymentTypes.indexOf(paymentType.name) === -1)) {
        li = $(`<li id=pt-${paymentType.name} class="facet-item"></li>`);
        li.html(`<p class="facet-wrapper"><span class="facet-option">${paymentType.name}</span></p>`);
        if(paymentType.isRefined) li.addClass('selected-facet');
      }
      return li;
    });
  });
}

function renderStats(content) {
  $('p#stats').html(() => {
    return `<b class="num-results-found">${content.nbHits} results found</b> in ${content.processingTimeMS / 1000} seconds`;
  });
}

function buildStarsReviewsParagraph(hit) {
  let starsParagraph = '<span>';
  const maxStars = 5;
  // I originally rounded instead of floored, but this could be confusing,
  // since filtering for five-star-rated restaurants yields no results
  const fullStars = Math.floor(hit.stars_count);
  const emptyStars = maxStars - fullStars;
  for(let i = 0; i < fullStars; i++) {
    starsParagraph+= '<img src="resources/graphics/stars-plain.png" class="star" />';
  }
  for(let i = 0; i < emptyStars; i++) {
    starsParagraph+= '<img src="resources/graphics/star-empty.png" class="star" />';
  }
  return starsParagraph + '</span>';
}

function buildHitHtml(hit, stars) {
  return `<div id="show-results">
          <ul id="results-list" class="results-list">
            <li class="result">
              <div>
              <img src="${hit.image_url}" class="result-img">
                <div class="result-text">
                  <p class="result-name">${hit.name}</p>
                  <p class="stars-reviews"><span class="star-rating">${hit.stars_count}</span>
                    ${stars}
                    <span class="reviews-description">(${hit.reviews_count} reviews)</span>
                  </p>
                  <p class="reviews-description no-left-margin">${hit.food_type} | ${hit.neighborhood} | ${hit.price_range}</p>
                </div>
              </div>
            </li>
          </ul>
        </div>`;
}

function showHideShowMoreButton(content) {
  const page = content.page + 1;
  if (page < content.nbPages) {
    $('#show-more').show();
  } else {
    $('#show-more').hide();
  }
}

// Append or replace, depending on context
function renderHits(content, appendResults) {
  if (appendResults) {
    $('#results-list').append(() => {
      return $.map(content.hits, hit => {
        let stars = buildStarsReviewsParagraph(hit);
        return buildHitHtml(hit, stars);
      });
    });
  } else {
    $('#results-list').html(() => {
      return $.map(content.hits, hit => {
        let stars = buildStarsReviewsParagraph(hit);
        return buildHitHtml(hit, stars);
      });
    });
  }
  showHideShowMoreButton(content)
}

// Pagination
$('#show-more').on('click', e => {
  appendResults = true;
  helper.setPage(helper.getPage() + 1).search();
});

function searchWithGeoEnabled(location) {
  helper.setQueryParameter('getRankingInfo', true);
  helper.setQueryParameter('aroundLatLng', `${location.coords.latitude},${location.coords.longitude}`);
  helper.setQueryParameter('aroundRadius', 10000);
  helper.search();
}

function searchWithoutGeoEnabled(error) {
  helper.setQueryParameter('aroundLatLngViaIP', true);
  helper.search();
}

function renderNoResultsFound(content) {
  $('#no-results-found').show();
  $('#show-results').hide();
  $('p#stats').html(() => {
    return `<b class="num-results-found">0 results found</b> in ${content.processingTimeMS / 1000} seconds`;
  });
}

function renderResults(content, appendResults) {
  $('#no-results-found').hide();
  $('#show-results').show();
  renderStats(content);
  renderHits(content, appendResults);
  renderFoodTypeList(content);
  renderPaymentFacetList(content);
}

helper.on('result', content => {
  if (content.nbHits === 0) {
    renderNoResultsFound(content);
  } else {
    renderResults(content, appendResults);
  }
});

// Search!
navigator.geolocation.getCurrentPosition(searchWithGeoEnabled, searchWithoutGeoEnabled);
