---
slug: examples
title: Examples
type: docs
group: practical-application
order: 1
groupOrder: 3
groupLabel: "Practical Application"
---

<h2 id="practicalApplicationHeader">Practical Application</h2>

**Dynamowaves** come out of the box entirely style agnostic. The onus is on the developer to add the necessary attributes to get them to fit their intended platform, but at the same time this provides nearly endless possibilities for customization.

Make use of **```position:sticky```** and create a neat little header!

```html
<!-- Widget classes not, uh, provided out-of-the-box -->
<div class="widget">
<div class="header">
    <h2>I'm the heading!</h2>
    <dynamo-wave data-wave-face="bottom"></dynamo-wave>
</div>
<div class="content">...</div>
</div>
```

<div class="widget" id="widget_example_1">
<div class="header">
<h2 id="im-the-heading">I'm the heading!</h2>
<dynamo-wave class="fill-theme" data-wave-face="bottom"></dynamo-wave>
</div>
<div class="content">Lorem ipsum dolor sit amet, ea sea regione concludaturque. Te eam pericula prodesset
constituto. In forensibus voluptatum nam. Ius ne modus laboramus, quo illud altera mandamus eu. Persius
oportere molestiae vel ut. Ei vel nusquam forensibus eloquentiam.
<br><br>
Mei in posse error incorrupte. Ex rebum vidisse sea. Per sumo quando mucius cu, no persius signiferumque
eos,
et has deserunt pertinacia. Ea malis everti nostrud sed.
<br><br>
Id regione prompta denique est, mei at veri essent instructior, mei id congue instructior. Nec ne legere
tritani sadipscing. Oblique propriae theophrastus id quo, vero persequeris vix cu. Qui singulis
pertinacia
ex,
ad agam doctus graecis eos, vis et erat accumsan.
<br><br>
Cum esse quot essent te, in delicata conceptam cum, dicam iuvaret inimicus mei ad. Est ex cetero commune
eleifend. Vim in aeque constituam, timeam debitis argumentum sed ea. His epicurei evertitur et, ea
sanctus
saperet sed. An harum referrentur nec, te sed errem patrioque, mei et tempor blandit sapientem. Vim te
aeterno
sapientem.
<br><br>
In eam putant labores accusam. Ne sed evertitur torquatos. Dolor option regione nam ei, summo constituto
usu
at. Postea accusata et has, his te prima porro verterem.
</div>
</div>
</div>

Use an animated **dynamowave** to add some more pizzazz to transition effects.

<div class="widget" id="widget_example_2">
    <div class="content" style="flex:1">
        <div>Content 1</div>
        <div>Content 2</div>
        <div>Content 3</div>
        <div>Content 4</div>
    </div>
    <div class="footer">
        <dynamo-wave class="fill-theme fill-light" id="transition-wave-example" data-wave-face="top"></dynamo-wave>
        <div class="content">
            <button style="margin-top:1rem" id="transition-wave-button" onclick="transition()">
                <span>Next</span>
                <i data-feather="chevrons-right"></i>
            </button>
        </div>
    </div>
</div>

Slap one of these bad boys along the edge of a photo to create an always fresh, **<code>mask-image</code>** effect without having to actually create multiple clip paths or image masks!

```html
<div class="widget horizontal">
    <div class="image-wrapper">
        <img src="./img/image_path.jpeg" />
        <!-- When covering an image, I find it helps the browser render 
        to set the far edge with a bit of a negative overlap
        It keeps the image from peeking through from behind the wave -->
        <dynamo-wave data-wave-face="left" style="fill:var(--widget-bg);position:absolute;right:-1px"></dynamo-wave>
    </div>
    <div class="content">...</div>
</div>
```

<div class="widget horizontal" id="widget_example_3" style="min-height:max-content">
    <div class="image-wrapper">
        <dynamo-wave data-wave-face="left"
        style="position:absolute;right:-1px;height:100%;width:1.5rem;fill:var(--widget-bg)">
        </dynamo-wave>
    </div>
    <div class="content" style="align-self: center;padding:1rem">
        <h2 id="eye-catching-headline" style="font-family:'Merriweather',serif;color:var(--theme);margin:0">
        Eye-catching headline.</h2>
        <p>Further information to draw interest.</p>
        <a href="#" aria-label="Fake example link">Explore This <i data-feather="arrow-right" style="width:20px;height:20px"></i></a>
    </div>
</div>