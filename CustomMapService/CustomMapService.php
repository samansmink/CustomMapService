<?php
/*
 * Custom Map Service Plugin
 *
 * Author       Sam Ansmink
 * Created for  NSCR (https://www.nscr.nl/)
 * License      GNU GPL
 *
 * This file contains the configuration for the plugin.
 */

class CustomMapService extends PluginBase {

    protected $storage = 'DbStorage';
    static protected $name = 'CustomMapService';
    static protected $description = 'Enables configuring any traditional raster (Mercator XYZ) map server.';
    
    protected $settings = array(

        'openmaptiles_url' => array(
            'type' => 'string',
            'label' => 'Map server url (Mercator XYZ format: ... {z}/{x}/{y}.png)'
        ),
        'nominatim_url' => array(
            'type' => 'string',
            'label' => 'Map server url (example: 192.168.99.100:32769)'
        )
    );
    
    public function __construct(PluginManager $manager, $id) {
        parent::__construct($manager, $id);
        
        
        /**
         * Here you should handle subscribing to the events your plugin will handle
         */
        $this->subscribe('beforeQuestionRender', 'replaceMapDiv');
        $this->subscribe('beforeQuestionRender', 'loadJs');
        $this->subscribe('beforeQuestionRender', 'setUrls');
    }

    public function replaceMapDiv() {

        $event = $this->event;

        $answerHtml = $event->get('answers');

        $correctedHtml = str_replace ( "mapservice_", 'mapservice_custommapservice_' , $answerHtml);

        $event->set('answers', $correctedHtml);
    }

    public function loadJs() {

        $assetUrl=Yii::app()->assetManager->publish(dirname(__FILE__) . '/assets/');
        Yii::app()->clientScript->registerScriptFile($assetUrl.'/CustomMapService.js');
    }

    public function setUrls() {

        $mapUrl = $this->get('openmaptiles_url');
        $nomUrl = $this->get('nominatim_url');

        print "<script type=\"text/javascript\">";
        print "window.CustomMapServiceUrl = \"$mapUrl\";";
        print "window.CustomNominatimServiceUrl = \"$nomUrl\";";
        print "</script>";
    }
}
