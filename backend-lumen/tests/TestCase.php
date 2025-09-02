<?php

namespace Tests;

use Laravel\Lumen\Testing\TestCase as BaseTestCase;

use Laravel\Lumen\Testing\DatabaseMigrations;


abstract class TestCase extends BaseTestCase
{
    /**
     * Creates the application.
     *
     * @return \Laravel\Lumen\Application
     */
    public function createApplication()
    {
        return require __DIR__.'/../bootstrap/app.php';
    }
}
